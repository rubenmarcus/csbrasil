extends Node


func _ready() -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.__csbrasilGodotReady = true;")

