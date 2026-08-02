# Ultimate Bash Guys Supreme (prototype)

This commit adds a small web prototype game and a start GUI. It implements:

- A start screen (GUI) that shows the character name "Sir Long-arms".
- A simple Three.js scene with a stage/floor and camera.
- Click to punch: the player lunges forward and can hit the enemy if in range.
- Enemy AI: walks toward the player, and when in range chooses one of: block (5%), punch (30%), special (25%), or walk away for ~2s (remaining probability). Enemy won't walk off the stage.

How to run

1. Open `index.html` in a browser (static file). It loads Three.js and the game script.
2. The game will try to load a model at `assets/models/work work smash fuh character noob.glb` if present.
   - If that GLB file is not in the repo, the game will use simple box placeholders for the player and enemy.
3. Click Start, then click anywhere in the canvas to punch.

Notes / next steps

- You included a Blender/GLB blob in the chat. I did not add the large binary file automatically to avoid corruption in transit. If you want me to commit that exact GLB into `assets/models/` (filename: `work work smash fuh character noob.glb`) I can do that in a follow-up push — tell me and I'll add it.
- If you want the model to be named differently, or want me to rig simple punch animations, provide the GLB (or let me commit the one you pasted) and I can wire up more detailed animations.

