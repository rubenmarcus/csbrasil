extends Node

@onready var player: PlayerController = $WorldHost/Match/Player
@onready var match_controller: CombatMatch = $WorldHost/Match
@onready var health_label: Label = $GuiHost/HUD/Health
@onready var ammo_label: Label = $GuiHost/HUD/Ammo
@onready var respawn_label: Label = $GuiHost/HUD/Respawn
@onready var scope_overlay: ColorRect = $GuiHost/HUD/ScopeOverlay
@onready var crosshair: Label = $GuiHost/Crosshair

var _web_state_elapsed: float = 0.0


func _ready() -> void:
	match_controller.hud_updated.connect(_on_hud_updated)
	match_controller.bot_state_changed.connect(_on_bot_state_changed)
	var hud := match_controller.current_hud()
	_on_hud_updated(hud.health, hud.weapon_name, hud.ammo, hud.reserve, hud.scoped)
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__csbrasilGodotReady = true; window.__csbrasilPlayerState = {};")


func _process(delta: float) -> void:
	if not OS.has_feature("web"):
		return
	_web_state_elapsed += delta
	if _web_state_elapsed < 0.1:
		return
	_web_state_elapsed = 0.0
	JavaScriptBridge.eval(
		"window.__csbrasilPlayerState={x:%f,y:%f,z:%f,crouch:%f,captured:%s,health:%d,weaponId:'%s',ammo:%d,reserve:%d,scoped:%s,botAlive:%s,botRespawn:%f};" % [
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
		]
	)


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
