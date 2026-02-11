import * as THREE from 'three';
import { setupScene } from '@/scene';
import { createPhysicsWorld, updatePhysics, createRigidBody } from '@/physics';
import { Player } from '@/Player';

export class Game {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private clock = new THREE.Clock();
    private physicsWorld: any;
    private rigidBodies: THREE.Mesh[] = [];
    private player: Player;

    constructor(private Ammo: any) {
        const { scene, camera, renderer } = setupScene();
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.physicsWorld = createPhysicsWorld(this.Ammo);

        this.createGround();
        this.createDynamicBox();

        this.player = new Player(this.Ammo, this.camera, this.scene);

        this.animate();
    }

    private createGround() {
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, 1, 100),
            new THREE.MeshStandardMaterial({ color: 'green' })
        );
        ground.position.y = -0.5;
        this.scene.add(ground);
        const groundShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(50, 0.5, 50));
        createRigidBody(this.Ammo, ground, groundShape, 0, this.physicsWorld, this.rigidBodies);
    }

    private createDynamicBox() {
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshStandardMaterial({ color: 'blue' })
        );
        box.position.set(5, 5, 0);
        this.scene.add(box);
        const boxShape = new this.Ammo.btBoxShape(new this.Ammo.btVector3(1, 1, 1));
        createRigidBody(this.Ammo, box, boxShape, 1, this.physicsWorld, this.rigidBodies);
    }

    private animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = this.clock.getDelta();

        this.player.update();
        updatePhysics(this.Ammo, this.physicsWorld, this.rigidBodies, deltaTime);

        this.renderer.render(this.scene, this.camera);
    }
}
