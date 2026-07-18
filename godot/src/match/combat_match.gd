class_name CombatMatch
extends Node

signal hud_updated(health: int, weapon_name: String, ammo: int, reserve: int, scoped: bool)
signal bot_state_changed(alive: bool, respawn_remaining: float)
signal killfeed_event(killer_name: String, victim_name: String, headshot: bool)
signal match_state_changed(state: Dictionary)

const BOT_SCENE := preload("res://src/actors/combat_bot.tscn")
const TARGET_SELECTOR := preload("res://src/ai/bot_target_selector.gd")
const WAYPOINT_GRAPH := preload("res://src/ai/waypoint_graph.gd")
const BOT_DEFINITIONS := [
	{"id": &"sindicato", "name": "Sindicato", "team": &"P", "spawn": Vector3(-6.0, 0.0, 8.0)},
	{ "id": &"mst", "name": "MST", "team": &"P", "spawn": Vector3(3.0, 0.0, 8.0) },
	{ "id": &"doutora", "name": "Doutora", "team": &"P", "spawn": Vector3(6.0, 0.0, 8.0) },
	{ "id": &"caminhoneiro", "name": "Caminhoneiro", "team": &"B", "spawn": Vector3(0.0, 0.0, 1.0) },
	{ "id": &"influencer", "name": "Influencer", "team": &"B", "spawn": Vector3(-6.0, 0.0, -8.0) },
	{ "id": &"sertanejo", "name": "Sertanejo", "team": &"B", "spawn": Vector3(0.0, 0.0, -8.0) },
	{ "id": &"tia_zila", "name": "Tia Zilá", "team": &"B", "spawn": Vector3(6.0, 0.0, -8.0) },
]

@onready var player: PlayerController = $"../Actors/Player"
@onready var bots_host: Node3D = $"../Actors/Bots"
@onready var rounds: RoundController = $"../RoundController"

var bot: CombatBot
var _bots: Array[CombatBot] = []
var _selector: BotTargetSelector = TARGET_SELECTOR.new()
var _graph: WaypointGraph = WAYPOINT_GRAPH.new()
var _think_remaining: float = 0.0
var _next_round_remaining: float = -1.0


func _ready() -> void:
	_build_navigation_graph()
	_build_rosters()
	_connect_actor(player)
	player.health_changed.connect(_on_player_health_changed)
	player.weapon_state_changed.connect(_on_weapon_state_changed)
	player.scope_changed.connect(_on_scope_changed)
	rounds.timer_changed.connect(_on_round_state_changed)
	rounds.score_changed.connect(_on_round_score_changed)
	rounds.round_ended.connect(_on_round_ended)
	rounds.match_ended.connect(_on_match_ended)
	rounds.start_match()
	_publish_hud()
	_publish_match_state()


func _process(delta: float) -> void:
	var combat_active := player.input_session_active and rounds.round_active
	for actor_bot in _bots:
		actor_bot.combat_enabled = combat_active
	if combat_active:
		rounds.advance(delta)
		_think_remaining -= delta
		if _think_remaining <= 0.0:
			_assign_targets()
			_think_remaining = 0.16
	if bot != null and not bot.alive:
		bot_state_changed.emit(false, bot.respawn_remaining)
	if _next_round_remaining >= 0.0 and not rounds.match_finished:
		_next_round_remaining -= delta
		if _next_round_remaining <= 0.0:
			start_next_round_now()


func actors() -> Array[Node3D]:
	var result: Array[Node3D] = [player]
	for actor_bot in _bots:
		result.append(actor_bot)
	return result


func team_members(team: StringName) -> Array[Node3D]:
	var result: Array[Node3D] = []
	for actor in actors():
		if StringName(actor.get("team")) == team:
			result.append(actor)
	return result


func start_next_round_now() -> void:
	_next_round_remaining = -1.0
	_reset_actors()
	rounds.start_next_round()
	_assign_targets()
	_publish_match_state()


func current_hud() -> Dictionary:
	return {
		"health": player.health.current_health,
		"weapon_name": player.weapon.definition.display_name,
		"ammo": player.weapon_inventory.current_ammo().x,
		"reserve": player.weapon_inventory.current_ammo().y,
		"scoped": player.scoped,
	}


func current_match_state() -> Dictionary:
	return {
		"round": rounds.round_number,
		"seconds": rounds.time_remaining,
		"petistas_kills": rounds.round_kills[&"P"],
		"bolsonaristas_kills": rounds.round_kills[&"B"],
		"petistas_wins": rounds.round_wins[&"P"],
		"bolsonaristas_wins": rounds.round_wins[&"B"],
		"finished": rounds.match_finished,
	}


func scoreboard_rows() -> Array[Dictionary]:
	var rows: Array[Dictionary] = []
	for actor in actors():
		rows.append({
			"name": actor.get("display_name"),
			"team": actor.get("team"),
			"kills": actor.get("kills"),
			"deaths": actor.get("deaths"),
		})
	return rows


func _build_rosters() -> void:
	for definition in BOT_DEFINITIONS:
		var actor_bot := BOT_SCENE.instantiate() as CombatBot
		actor_bot.name = String(definition.id)
		actor_bot.actor_id = definition.id
		actor_bot.display_name = definition.name
		actor_bot.team = definition.team
		actor_bot.position = definition.spawn
		bots_host.add_child(actor_bot)
		actor_bot.set_navigation_graph(_graph)
		_connect_actor(actor_bot)
		_bots.append(actor_bot)
		if bot == null and actor_bot.team == &"B":
			bot = actor_bot
	_assign_targets()


func _connect_actor(actor: Node3D) -> void:
	actor.died.connect(_on_actor_died.bind(actor))
	if actor is CombatBot:
		actor.respawned.connect(_on_bot_respawned.bind(actor))


func _assign_targets() -> void:
	var candidates: Array = actors()
	for actor_bot in _bots:
		actor_bot.target_actor = _selector.choose(actor_bot, candidates)


func _reset_actors() -> void:
	for actor in actors():
		actor.reset_for_round()


func _build_navigation_graph() -> void:
	var positions: Array[Vector3] = [
		Vector3(-6.0, 0.0, 8.0), Vector3(0.0, 0.0, 8.0), Vector3(6.0, 0.0, 8.0),
		Vector3(-5.0, 0.0, 3.0), Vector3(5.0, 0.0, 3.0),
		Vector3(-5.0, 0.0, -3.0), Vector3(5.0, 0.0, -3.0),
		Vector3(-6.0, 0.0, -8.0), Vector3(0.0, 0.0, -8.0), Vector3(6.0, 0.0, -8.0),
	]
	for position in positions:
		_graph.add_point(position)
	for connection in [[0, 3], [1, 3], [1, 4], [2, 4], [3, 5], [4, 6], [5, 7], [5, 8], [6, 8], [6, 9]]:
		_graph.connect_points(connection[0], connection[1])


func _publish_hud() -> void:
	var hud := current_hud()
	hud_updated.emit(hud.health, hud.weapon_name, hud.ammo, hud.reserve, hud.scoped)


func _publish_match_state() -> void:
	match_state_changed.emit(current_match_state())


func _on_player_health_changed(_current: int) -> void:
	_publish_hud()


func _on_weapon_state_changed(_weapon_name: String, _ammo: int, _reserve: int) -> void:
	_publish_hud()


func _on_scope_changed(_active: bool) -> void:
	_publish_hud()


func _on_actor_died(source: Node, headshot: bool, victim: Node3D) -> void:
	if source != null and source != victim and source.get("team") != null:
		var source_team := StringName(source.get("team"))
		if source_team != StringName(victim.get("team")):
			source.set("kills", int(source.get("kills")) + 1)
			rounds.register_kill(source_team)
			killfeed_event.emit(
				String(source.get("display_name")), String(victim.get("display_name")), headshot
			)
	if victim == bot:
		bot_state_changed.emit(false, bot.respawn_remaining)
	_publish_match_state()


func _on_bot_respawned(actor_bot: CombatBot) -> void:
	if actor_bot == bot:
		bot_state_changed.emit(true, 0.0)


func _on_round_state_changed(_seconds: float) -> void:
	_publish_match_state()


func _on_round_score_changed(_team: StringName, _kills: int) -> void:
	_publish_match_state()


func _on_round_ended(
	_winner: StringName, _petistas_kills: int, _bolsonaristas_kills: int
) -> void:
	for actor_bot in _bots:
		actor_bot.combat_enabled = false
	_next_round_remaining = 2.0
	_publish_match_state()


func _on_match_ended(_winner: StringName) -> void:
	_next_round_remaining = -1.0
	_publish_match_state()
