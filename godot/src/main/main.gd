extends Node

@onready var player: PlayerController = $WorldHost/Match/Actors/Player
@onready var match_controller: CombatMatch = $WorldHost/Match/MatchController
@onready var health_label: Label = $GuiHost/HUD/Health
@onready var ammo_label: Label = $GuiHost/HUD/Ammo
@onready var respawn_label: Label = $GuiHost/HUD/Respawn
@onready var round_timer_label: Label = $GuiHost/HUD/RoundTimer
@onready var team_score_label: Label = $GuiHost/HUD/TeamScore
@onready var killfeed_label: Label = $GuiHost/HUD/Killfeed
@onready var scoreboard: ColorRect = $GuiHost/HUD/Scoreboard
@onready var scoreboard_rows: Label = $GuiHost/HUD/Scoreboard/Rows
@onready var scope_overlay: ColorRect = $GuiHost/HUD/ScopeOverlay
@onready var crosshair: Label = $GuiHost/Crosshair

var _web_state_elapsed: float = 0.0


func _ready() -> void:
	match_controller.hud_updated.connect(_on_hud_updated)
	match_controller.bot_state_changed.connect(_on_bot_state_changed)
	match_controller.match_state_changed.connect(_on_match_state_changed)
	match_controller.killfeed_event.connect(_on_killfeed_event)
	var hud := match_controller.current_hud()
	_on_hud_updated(hud.health, hud.weapon_name, hud.ammo, hud.reserve, hud.scoped)
	_on_match_state_changed(match_controller.current_match_state())
	_refresh_scoreboard()
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__csbrasilGodotReady = true; window.__csbrasilPlayerState = {};")


func _process(delta: float) -> void:
	if not OS.has_feature("web"):
		return
	_web_state_elapsed += delta
	if _web_state_elapsed < 0.1:
		return
	_web_state_elapsed = 0.0
	var match_state := match_controller.current_match_state()
	JavaScriptBridge.eval(
		"window.__csbrasilPlayerState={x:%f,y:%f,z:%f,crouch:%f,captured:%s,health:%d,weaponId:'%s',ammo:%d,reserve:%d,scoped:%s,botAlive:%s,botRespawn:%f,actorCount:%d,petistasCount:%d,bolsonaristasCount:%d,round:%d,roundSeconds:%f,petistasKills:%d,bolsonaristasKills:%d,scoreboardVisible:%s};" % [
			player.position.x,
			player.position.y,
			player.position.z,
			player.crouch_fraction,
			"true" if player.input_session_active else "false",
			player.health.current_health,
			player.weapon.definition.weapon_id,
			player.weapon_inventory.current_ammo().x,
			player.weapon_inventory.current_ammo().y,
			"true" if player.scoped else "false",
			"true" if match_controller.bot.alive else "false",
			match_controller.bot.respawn_remaining,
			match_controller.actors().size(),
			match_controller.team_members(&"P").size(),
			match_controller.team_members(&"B").size(),
			int(match_state.round),
			float(match_state.seconds),
			int(match_state.petistas_kills),
			int(match_state.bolsonaristas_kills),
			"true" if scoreboard.visible else "false",
		]
	)


func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.keycode == KEY_TAB:
		set_scoreboard_visible(event.pressed)


func set_scoreboard_visible(active: bool) -> void:
	scoreboard.visible = active
	if active:
		_refresh_scoreboard()


func _on_hud_updated(
	health: int, weapon_name: String, ammo: int, reserve: int, scoped: bool
) -> void:
	health_label.text = "VIDA %d" % health
	ammo_label.text = weapon_name if ammo < 0 else "%s %d / %d" % [weapon_name, ammo, reserve]
	scope_overlay.visible = scoped
	crosshair.visible = not scoped


func _on_bot_state_changed(alive: bool, remaining: float) -> void:
	respawn_label.visible = not alive
	if not alive:
		respawn_label.text = "INIMIGO REAPARECE EM %.1f" % remaining


func _on_match_state_changed(state: Dictionary) -> void:
	var total_seconds := ceili(float(state.seconds))
	round_timer_label.text = "%d:%02d" % [total_seconds / 60, total_seconds % 60]
	team_score_label.text = "P %d (%d)  ×  (%d) %d B" % [
		int(state.petistas_kills),
		int(state.petistas_wins),
		int(state.bolsonaristas_wins),
		int(state.bolsonaristas_kills),
	]
	if scoreboard.visible:
		_refresh_scoreboard()


func _on_killfeed_event(killer_name: String, victim_name: String, headshot: bool) -> void:
	killfeed_label.text = "%s  %s  %s" % [killer_name, "🎯" if headshot else "✦", victim_name]
	_refresh_scoreboard()


func _refresh_scoreboard() -> void:
	var lines: Array[String] = ["JOGADOR                 K/D"]
	for team in [&"P", &"B"]:
		lines.append("\nPETISTAS" if team == &"P" else "\nBOLSONARISTAS")
		for row in match_controller.scoreboard_rows():
			if StringName(row.team) == team:
				lines.append("%-20s %d/%d" % [row.name, row.kills, row.deaths])
	scoreboard_rows.text = "\n".join(lines)
