class_name MinimalArena
extends Node3D

@export var arena_size: Vector2 = Vector2(32.0, 24.0)

@onready var geometry: Node3D = $Geometry


func _ready() -> void:
	_build_box("Floor", Vector3(arena_size.x, 0.2, arena_size.y), Vector3(0.0, -0.1, 0.0), Color("58606b"))
	_build_box("NorthWall", Vector3(arena_size.x, 3.0, 0.4), Vector3(0.0, 1.5, -arena_size.y * 0.5), Color("343b45"))
	_build_box("SouthWall", Vector3(arena_size.x, 3.0, 0.4), Vector3(0.0, 1.5, arena_size.y * 0.5), Color("343b45"))
	_build_box("WestWall", Vector3(0.4, 3.0, arena_size.y), Vector3(-arena_size.x * 0.5, 1.5, 0.0), Color("343b45"))
	_build_box("EastWall", Vector3(0.4, 3.0, arena_size.y), Vector3(arena_size.x * 0.5, 1.5, 0.0), Color("343b45"))
	_build_box("CenterObstacle", Vector3(3.0, 2.5, 3.0), Vector3(0.0, 1.25, -2.0), Color("7a4d32"))
	_build_box("WalkableStep", Vector3(3.0, 0.5, 2.0), Vector3(6.0, 0.25, 3.0), Color("b8a27a"))


func _build_box(node_name: String, size: Vector3, center: Vector3, color: Color) -> void:
	var body := StaticBody3D.new()
	body.name = node_name
	body.position = center
	geometry.add_child(body)

	var shape := BoxShape3D.new()
	shape.size = size
	var collision := CollisionShape3D.new()
	collision.name = "CollisionShape3D"
	collision.shape = shape
	body.add_child(collision)

	var mesh := BoxMesh.new()
	mesh.size = size
	var material := StandardMaterial3D.new()
	material.albedo_color = color
	material.roughness = 0.88
	mesh.material = material
	var visual := MeshInstance3D.new()
	visual.name = "MeshInstance3D"
	visual.mesh = mesh
	body.add_child(visual)
