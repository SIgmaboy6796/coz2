import * as THREE from 'three';
import { setupScene } from '@/scene';
import { createPhysicsWorld, updatePhysics, createRigidBody } from '@/physics';
import { Player } from '@/Player';
import { Multiplayer } from '@/Multiplayer';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock = new THREE.Clock();
    private physicsWorld: any;
    private rigidBodies: THREE.Mesh[] = [];
    private player: Player;
    private multiplayer: Multiplayer;

    constructor(private Ammo: any) {
        const { scene, camera, renderer } = setupScene();
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.physicsWorld = createPhysicsWorld(this.Ammo);
        this.multiplayer = new Multiplayer();

        this.createGround();
        this.createDynamicBox();
        this.createTestCubes();
        this.createBoundaryWalls();

        this.player = new Player(this.Ammo, this.camera, this.physicsWorld, this.scene, this.rigidBodies);
        
        // Set up pause menu host button callbacks
        this.player.setOnHostClick(() => {
            this.hostGame();
        });

        this.player.setOnStopHostClick(() => {
            this.stopHosting();
        });

        this.player.setOnHostingChange((isHosting) => {
            if (!isHosting) {
                // Hosting stopped - show message to other players
                console.log('Game hosting stopped');
            }
        });

        this.animate();
    }

    private createGround() {
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, 1, 100),
            new THREE.MeshStandardMaterial({ color: 'green' })
        );
        ground.position.y = -0.5;
        ground.castShadow = true;
        ground.receiveShadow = true;
        this.scene.add(ground);
        const groundShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(50, 0.5, 50));
        createRigidBody(this.Ammo, ground, groundShape, 0, this.physicsWorld, this.rigidBodies);
    }

    private createDynamicBox() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.8, 0.8),
            new THREE.MeshStandardMaterial({ color: 'blue' })
        );
        box.position.set(5, 5, 0);
        box.castShadow = true;
        box.receiveShadow = true;
        this.scene.add(box);
        const boxShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(0.4, 0.4, 0.4));
        const body = createRigidBody(this.Ammo, box, boxShape, 1, this.physicsWorld, this.rigidBodies);
        box.userData.physicsBody = body;
    }

    private createTestCubes() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
        let colorIndex = 0;

        for (let x = -15; x < 20; x += 5) {
            for (let z = -15; z < 20; z += 5) {
                const box = new THREE.Mesh(
                    new THREE.BoxGeometry(0.5, 0.5, 0.5),
                    new THREE.MeshStandardMaterial({ color: colors[colorIndex % colors.length] })
                );
                box.position.set(x, 5 + Math.random() * 3, z);
                box.castShadow = true;
                box.receiveShadow = true;
                this.scene.add(box);

                const boxShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(0.25, 0.25, 0.25));
                const body = createRigidBody(this.Ammo, box, boxShape, 0.5, this.physicsWorld, this.rigidBodies);
                box.userData.physicsBody = body;
                colorIndex++;
            }
        }
    }

    private createBoundaryWalls() {
        const wallThickness = 1;
        const wallHeight = 20;
        const mapSize = 50;

        // Create invisible walls on all four sides
        const walls = [
            { pos: [0, wallHeight / 2, -mapSize], size: [mapSize * 2, wallHeight, wallThickness] }, // Front
            { pos: [0, wallHeight / 2, mapSize], size: [mapSize * 2, wallHeight, wallThickness] },   // Back
            { pos: [-mapSize, wallHeight / 2, 0], size: [wallThickness, wallHeight, mapSize * 2] }, // Left
            { pos: [mapSize, wallHeight / 2, 0], size: [wallThickness, wallHeight, mapSize * 2] }   // Right
        ];

        walls.forEach(wall => {
            const [x, y, z] = wall.pos;
            const [sx, sy, sz] = wall.size;
            const shape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(sx / 2, sy / 2, sz / 2));

            const transform = new this.Ammo.btTransform();
            transform.setIdentity();
            transform.setOrigin(new this.Ammo.btVector3(x, y, z));
            const motionState = new this.Ammo.btDefaultMotionState(transform);

            const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(0, motionState, shape, new this.Ammo.btVector3(0, 0, 0));
            const body = new this.Ammo.btRigidBody(rbInfo);
            this.physicsWorld.addRigidBody(body);
        });
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();

        this.player.update();
        updatePhysics(this.Ammo, this.physicsWorld, this.rigidBodies, deltaTime);

        this.renderer.render(this.scene, this.camera);
    }

    private async hostGame() {
        try {
            console.log('[Game] Starting host...');
            const shareUrl = await this.multiplayer.hostGame();
            this.player.setHosting(true);
            this.player.showMultiplayerShareLink(shareUrl);
            console.log('[Game] Hosting started successfully');
        } catch (error) {
            console.error('[Game] Failed to host game:', error);
        }
    }

    private stopHosting() {
        console.log('[Game] Stopping host...');
        this.multiplayer.stopHosting();
        this.player.setHosting(false);
        console.log('[Game] Hosting stopped');
    }
}
