extends GutTest

const MATCH_SCENE_PATH := "res://src/match/movement_match.tscn"
const MAIN_SCENE_PATH := "res://src/main/main.tscn"


func test_match_composes_player_awp_bot_and_combat_hud() -> void:
	var match_scene := (load(MATCH_SCENE_PATH) as PackedScene).instantiate()
	add_child_autofree(match_scene)
	assert_not_null(match_scene.get_node_or_null("Player/CameraPivot/Camera3D/AWP"))
	assert_not_null(match_scene.get_node_or_null("Bot"))
	assert_eq(match_scene.get_node("Bot").position, Vector3(0.0, 0.0, 1.0))

	var main := (load(MAIN_SCENE_PATH) as PackedScene).instantiate()
	add_child_autofree(main)
	assert_eq(main.get_node("GuiHost/HUD/Health").text, "VIDA 100")
	assert_eq(main.get_node("GuiHost/HUD/Ammo").text, "AWP 5 / 25")
	assert_false(main.get_node("GuiHost/HUD/Respawn").visible)
	main.player.set_scoped(true)
	assert_true(main.get_node("GuiHost/HUD/ScopeOverlay").visible)
	assert_false(main.get_node("GuiHost/Crosshair").visible)


func test_bot_respawns_after_legacy_delay() -> void:
	var bot := (load("res://src/actors/combat_bot.tscn") as PackedScene).instantiate()
	add_child_autofree(bot)
	bot.respawn_delay = 0.05
	assert_true(bot.take_damage(400, null, true))
	assert_false(bot.alive)
	await wait_seconds(0.08)
	assert_true(bot.alive)
	assert_eq(bot.health.current_health, 100)


func test_player_awp_completes_headshot_death_cycle() -> void:
	var match_scene := (load(MATCH_SCENE_PATH) as PackedScene).instantiate()
	add_child_autofree(match_scene)
	var player := match_scene.get_node("Player")
	var bot := match_scene.get_node("Bot")
	await wait_physics_frames(3)
	player.set_scoped(true)
	var origin: Vector3 = player.camera.global_position
	var target: Vector3 = bot.global_position + Vector3(0.0, 1.55, 0.0)
	var result: Dictionary = player.weapon.fire(origin, origin.direction_to(target), player)

	assert_true(result.headshot)
	assert_true(result.killed)
	assert_false(bot.alive)
	assert_almost_eq(bot.respawn_remaining, 2.5, 0.05)


func test_player_death_restores_health_and_movement_after_respawn() -> void:
	var match_scene := (load(MATCH_SCENE_PATH) as PackedScene).instantiate()
	add_child_autofree(match_scene)
	var player := match_scene.get_node("Player")
	player.respawn_delay = 0.05
	assert_true(player.take_damage(400, match_scene.get_node("Bot"), false))
	assert_false(player.accepts_input)
	await wait_seconds(0.08)
	assert_eq(player.health.current_health, 100)
	assert_true(player.accepts_input)
	assert_eq(player.velocity, Vector3.ZERO)


func test_bot_reacts_and_applies_legacy_damage_to_exposed_player() -> void:
	var match_scene := (load(MATCH_SCENE_PATH) as PackedScene).instantiate()
	add_child_autofree(match_scene)
	var player := match_scene.get_node("Player")
	player.input_session_active = true
	await wait_physics_frames(65)
	assert_eq(player.health.current_health, 58)
	assert_true(player.accepts_input)
