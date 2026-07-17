class_name CombatBot
extends CharacterBody3D

signal died(source: Node, headshot: bool)
signal respawned

@export var respawn_delay: float = 2.5

@onready var health: HealthComponent = $Health
@onready var body_collision: CollisionShape3D = $BodyCollision
@onready var head_hitbox: Area3D = $HeadHitbox
@onready var visuals: Node3D = $Visuals
@onready var weapon: HitscanWeapon = $AWP

var alive: bool = true
var respawn_remaining: float = 0.0
var target_actor: PlayerController
var reaction_seconds: float = 0.8
var _target_visible_for: float = 0.0


func _ready() -> void:
	health.died.connect(_on_health_died)
	weapon.scoped = true


func _physics_process(delta: float) -> void:
	if alive:
		_update_attack(delta)
		return
	respawn_remaining = maxf(0.0, respawn_remaining - delta)
	if respawn_remaining <= 0.0:
		respawn()


func take_damage(amount: int, source: Node = null, headshot: bool = false) -> bool:
	return health.take_damage(amount, source, headshot)


func respawn() -> void:
	health.reset()
	alive = true
	body_collision.disabled = false
	head_hitbox.monitorable = true
	visuals.visible = true
	_target_visible_for = 0.0
	respawned.emit()


func _on_health_died(source: Node, headshot: bool) -> void:
	alive = false
	respawn_remaining = respawn_delay
	body_collision.set_deferred("disabled", true)
	head_hitbox.set_deferred("monitorable", false)
	visuals.visible = false
	died.emit(source, headshot)


func _update_attack(delta: float) -> void:
	if target_actor == null or not target_actor.health.is_alive() or not target_actor.input_session_active:
		_target_visible_for = 0.0
		return
	var origin := global_position + Vector3(0.0, 1.55, 0.0)
	var target := target_actor.camera.global_position
	var query := PhysicsRayQueryParameters3D.create(origin, target)
	query.exclude = [get_rid(), head_hitbox.get_rid()]
	query.collide_with_areas = true
	var sight: Dictionary = get_world_3d().direct_space_state.intersect_ray(query)
	if sight.is_empty() or sight.collider != target_actor:
		_target_visible_for = 0.0
		return
	_target_visible_for += delta
	if _target_visible_for >= reaction_seconds:
		weapon.fire(origin, origin.direction_to(target), self)
