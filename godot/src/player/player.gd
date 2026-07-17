class_name PlayerController
extends CharacterBody3D

signal input_capture_changed(captured: bool)

const MovementConfigScript := preload("res://src/player/movement_config.gd")
const MovementMotorScript := preload("res://src/player/movement_motor.gd")

@export var movement_config: Resource = MovementConfigScript.new()
@export var accepts_input: bool = true

@onready var camera_pivot: Node3D = $CameraPivot
@onready var camera: Camera3D = $CameraPivot/Camera3D
@onready var collision_shape: CollisionShape3D = $CollisionShape3D

var crouch_fraction: float = 0.0
var scoped: bool = false
var input_session_active: bool = false
var _pitch: float = 0.0
var _motor: RefCounted


func _ready() -> void:
	_motor = MovementMotorScript.new(movement_config)
	# The scene resource is shared; each actor must own its mutable crouch shape.
	collision_shape.shape = collision_shape.shape.duplicate()
	camera.fov = movement_config.base_fov


func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
		capture_pointer()
	elif event is InputEventKey and event.keycode == KEY_ESCAPE and event.pressed:
		release_pointer()
	elif event is InputEventMouseMotion and _is_pointer_captured() and accepts_input:
		rotate_view(event.relative)


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		release_pointer()


func _physics_process(delta: float) -> void:
	if not accepts_input or (OS.has_feature("web") and not input_session_active):
		velocity.x = 0.0
		velocity.z = 0.0
		return

	var axis := Input.get_vector("move_left", "move_right", "move_forward", "move_back")
	var grounded := is_on_floor()
	var wants_crouch := Input.is_action_pressed("crouch")
	crouch_fraction = _motor.next_crouch_fraction(crouch_fraction, wants_crouch, grounded, delta)
	var sprinting := Input.is_action_pressed("sprint") and crouch_fraction < 0.3
	velocity = _motor.horizontal_velocity(
		velocity, axis, rotation.y, grounded, sprinting, scoped, crouch_fraction, delta
	)
	velocity.y = _motor.vertical_velocity(
		velocity.y, grounded, Input.is_action_just_pressed("jump"), delta
	)
	var horizontal_velocity := Vector3(velocity.x, 0.0, velocity.z)
	_prepare_step_up(horizontal_velocity * delta, grounded)
	move_and_slide()
	_update_body_and_camera(sprinting, axis.length() > 0.0, delta)


func rotate_view(relative_motion: Vector2) -> void:
	rotation.y -= relative_motion.x * movement_config.mouse_sensitivity
	_pitch = clampf(
		_pitch - relative_motion.y * movement_config.mouse_sensitivity,
		movement_config.minimum_pitch,
		movement_config.maximum_pitch
	)
	camera_pivot.rotation.x = _pitch


func capture_pointer() -> void:
	if not accepts_input:
		return
	if OS.has_feature("web"):
		JavaScriptBridge.eval("document.getElementById('canvas').requestPointerLock();")
	input_session_active = true
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
	input_capture_changed.emit(true)


func release_pointer() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("if (document.pointerLockElement) document.exitPointerLock();")
	input_session_active = false
	Input.mouse_mode = Input.MOUSE_MODE_VISIBLE
	input_capture_changed.emit(false)


func _is_pointer_captured() -> bool:
	return Input.mouse_mode == Input.MOUSE_MODE_CAPTURED


func _prepare_step_up(horizontal_motion: Vector3, grounded: bool) -> void:
	if not grounded or horizontal_motion.is_zero_approx():
		return
	if not test_move(global_transform, horizontal_motion):
		return

	# CharacterBody3D does not climb box steps automatically. Probe the surface
	# ahead and lift only when it stays within the legacy 0.55 meter contract.
	var direction := horizontal_motion.normalized()
	var probe_distance: float = float(movement_config.collision_radius) + horizontal_motion.length() + 0.08
	var probe_center := global_position + direction * probe_distance
	var maximum_step: float = float(movement_config.maximum_step_height)
	var query := PhysicsRayQueryParameters3D.create(
		probe_center + Vector3.UP * (maximum_step + 0.05),
		probe_center + Vector3.DOWN * 0.1
	)
	query.exclude = [get_rid()]
	var hit: Dictionary = get_world_3d().direct_space_state.intersect_ray(query)
	if hit.is_empty():
		return
	var step_height: float = float(hit.position.y) - global_position.y
	if step_height <= 0.01 or step_height > maximum_step:
		return

	global_position.y += step_height + 0.001


func _update_body_and_camera(sprinting: bool, moving: bool, delta: float) -> void:
	camera_pivot.position.y = movement_config.eye_height_for(crouch_fraction)
	var capsule := collision_shape.shape as CapsuleShape3D
	var body_height: float = lerpf(1.8, 1.28, crouch_fraction)
	capsule.height = body_height
	collision_shape.position.y = body_height * 0.5
	var target_fov: float = movement_config.scope_fov if scoped else (
		movement_config.sprint_fov if sprinting and moving else movement_config.base_fov
	)
	camera.fov = lerpf(camera.fov, target_fov, minf(1.0, delta * 12.0))
