extends Node

@onready var player: CharacterBody3D = $WorldHost/Match/Player

var _web_state_elapsed: float = 0.0


func _ready() -> void:
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
		"window.__csbrasilPlayerState={x:%f,y:%f,z:%f,crouch:%f,captured:%s};" % [
			player.position.x,
			player.position.y,
			player.position.z,
			player.crouch_fraction,
			"true" if player.input_session_active else "false",
		]
	)
