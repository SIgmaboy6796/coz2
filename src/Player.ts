import * as THREE from 'three';

export class Player {
    private camera: THREE.PerspectiveCamera;
    private body: any;
    private input = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false
    };
    private moveSpeed = 10;
    private jumpForce = 7;

    constructor(private Ammo: any, camera: THREE.PerspectiveCamera, physicsWorld: any) {
        this.camera = camera;

        const radius = 0.5;
        const height = 2;
        const shape = new this.Ammo.btCapsuleShape(radius, height - 2 * radius);

        const transform = new this.Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.Ammo.btVector3(0, 10, 0));
        const motionState = new this.Ammo.btDefaultMotionState(transform);

        const localInertia = new this.Ammo.btVector3(0, 0, 0);
        shape.calculateLocalInertia(80, localInertia);

        const rbInfo = new this.Ammo.btRigidBodyConstructionInfo(80, motionState, shape, localInertia);
        this.body = new this.Ammo.btRigidBody(rbInfo);
        this.body.setActivationState(4); // Disable deactivation
        this.body.setAngularFactor(new this.Ammo.btVector3(0, 1, 0)); // Lock rotation on X and Z axes
        physicsWorld.addRigidBody(this.body);

        this.setupInput();
    }

    private setupInput() {
        window.addEventListener('keydown', (e) => {
            switch (e.code) {
                case 'KeyW': this.input.forward = true; break;
                case 'KeyS': this.input.backward = true; break;
                case 'KeyA': this.input.left = true; break;
                case 'KeyD': this.input.right = true; break;
                case 'Space': this.input.jump = true; break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case 'KeyW': this.input.forward = false; break;
                case 'KeyS': this.input.backward = false; break;
                case 'KeyA': this.input.left = false; break;
                case 'KeyD': this.input.right = false; break;
                case 'Space': this.input.jump = false; break;
            }
        });
    }

    public update(deltaTime: number) {
        const moveDirection = new THREE.Vector3();
        if (this.input.forward) moveDirection.z -= 1;
        if (this.input.backward) moveDirection.z += 1;
        if (this.input.left) moveDirection.x -= 1;
        if (this.input.right) moveDirection.x += 1;

        if (moveDirection.lengthSq() > 0) {
            moveDirection.normalize().multiplyScalar(this.moveSpeed * deltaTime);
            
            // Apply movement relative to camera direction
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3().crossVectors(this.camera.up, forward).normalize();

            const desiredVelocity = new THREE.Vector3()
                .add(forward.multiplyScalar(-moveDirection.z))
                .add(right.multiplyScalar(moveDirection.x));

            this.body.setLinearVelocity(new this.Ammo.btVector3(desiredVelocity.x * this.moveSpeed, this.body.getLinearVelocity().y(), desiredVelocity.z * this.moveSpeed));
        }

        if (this.input.jump) {
            // A simple check to see if the player is on the ground
            // This can be improved with raycasting
            if (this.body.getCenterOfMassPosition().y() < 2) {
                 this.body.applyCentralImpulse(new this.Ammo.btVector3(0, this.jumpForce, 0));
            }
        }

        const pos = this.body.getCenterOfMassPosition();
        this.camera.position.set(pos.x(), pos.y(), pos.z());
    }
}
