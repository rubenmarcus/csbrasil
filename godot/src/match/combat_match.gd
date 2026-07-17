class_name CombatMatch
extends Node3D

signal hud_updated(health: int, ammo: int, reserve: int, scoped: bool)
signal bot_state_changed(alive: bool, respawn_remaining: float)

@onready var player: PlayerController = $Player
@onready var bot: CombatBot = $Bot


func _ready() -> void:
	bot.target_actor = player
	player.health_changed.connect(_on_player_health_changed)
	player.weapon_state_changed.connect(_on_weapon_state_changed)
	player.scope_changed.connect(_on_scope_changed)
	bot.died.connect(_on_bot_died)
	bot.respawned.connect(_on_bot_respawned)
	_publish_hud()


func _process(_delta: float) -> void:
	if not bot.alive:
		bot_state_changed.emit(false, bot.respawn_remaining)


func current_hud() -> Dictionary:
	return {
		"health": player.health.current_health,
		"ammo": player.weapon.state.ammo,
		"reserve": player.weapon.state.reserve,
		"scoped": player.scoped,
	}


func _publish_hud() -> void:
	var hud := current_hud()
	hud_updated.emit(hud.health, hud.ammo, hud.reserve, hud.scoped)


func _on_player_health_changed(_current: int) -> void:
	_publish_hud()


func _on_weapon_state_changed(_ammo: int, _reserve: int) -> void:
	_publish_hud()


func _on_scope_changed(_active: bool) -> void:
	_publish_hud()


func _on_bot_died(_source: Node, _headshot: bool) -> void:
	bot_state_changed.emit(false, bot.respawn_remaining)


func _on_bot_respawned() -> void:
	bot_state_changed.emit(true, 0.0)
