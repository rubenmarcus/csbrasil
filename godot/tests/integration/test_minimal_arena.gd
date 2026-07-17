extends GutTest

const ARENA_SCENE_PATH := "res://src/arena/minimal_arena.tscn"


func test_arena_generates_floor_walls_and_step_at_runtime() -> void:
	assert_true(ResourceLoader.exists(ARENA_SCENE_PATH), "Minimal arena scene must exist")
	if not ResourceLoader.exists(ARENA_SCENE_PATH):
		return

	var arena := (load(ARENA_SCENE_PATH) as PackedScene).instantiate()
	add_child_autofree(arena)
	assert_true(arena.get_node("Geometry/Floor") is StaticBody3D)
	assert_true(arena.get_node("Geometry/NorthWall") is StaticBody3D)
	assert_true(arena.get_node("Geometry/CenterObstacle") is StaticBody3D)
	assert_true(arena.get_node("Geometry/WalkableStep") is StaticBody3D)
	assert_eq(arena.get_node("Geometry").get_child_count(), 7)

	var step_shape := arena.get_node("Geometry/WalkableStep/CollisionShape3D").shape as BoxShape3D
	assert_almost_eq(step_shape.size.y, 0.5, 0.001)
