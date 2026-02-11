import * as THREE from 'three';
import { PauseMenu, GameSettings } from '@/PauseMenu';

export class Player {
    private camera: THREE.PerspectiveCamera;
    private body: any;
    private input = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        pickup: false,
        throw: false
    };
    private moveSpeed = 10;
    private jumpForce = 7;
    private euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private mouseDelta = { x: 0, y: 0 };
    private sensitivity = 0.05;
    private pauseMenu: PauseMenu;
    private isPaused = false;
    private raycaster = new THREE.Raycaster();
    private pickedObject: any = null;
    private constraintDist = 5;
    private scene: THREE.Scene;
    private physicsWorld: any;
    private rigidBodies: THREE.Mesh[];
    private keybinds = {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        jump: 'Space',
        pickup: 'KeyE',
        throw: 'KeyF'
    };

    private defaultSettings: GameSettings = {
        sensitivity: 0.05,
        keybinds: this.keybinds
    };

    constructor(private Ammo: any, camera: THREE.PerspectiveCamera, physicsWorld: any, scene: THREE.Scene, rigidBodies: THREE.Mesh[]) {
        this.camera = camera;
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.rigidBodies = rigidBodies;
        this.pauseMenu = new PauseMenu(this.defaultSettings);

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
            if (this.isPaused) return;
            switch (e.code) {
                case this.keybinds.forward: this.input.forward = true; break;
                case this.keybinds.backward: this.input.backward = true; break;
                case this.keybinds.left: this.input.left = true; break;
                case this.keybinds.right: this.input.right = true; break;
                case this.keybinds.jump: this.input.jump = true; break;
                case this.keybinds.pickup: this.input.pickup = true; break;
                case this.keybinds.throw: this.input.throw = true; break;
                case 'Escape': this.togglePauseMenu(); break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case this.keybinds.forward: this.input.forward = false; break;
                case this.keybinds.backward: this.input.backward = false; break;
                case this.keybinds.left: this.input.left = false; break;
                case this.keybinds.right: this.input.right = false; break;
                case this.keybinds.jump: this.input.jump = false; break;
                case this.keybinds.pickup: this.input.pickup = false; break;
                case this.keybinds.throw: this.input.throw = false; break;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.isPaused) {
                this.mouseDelta.x += e.movementX * this.sensitivity;
                this.mouseDelta.y += e.movementY * this.sensitivity;
            }
        });

        document.addEventListener('click', () => {
            if (!this.isPaused) {
                document.body.requestPointerLock();
            }
        });

        // Handle pointer lock change (mouse escape)
        document.addEventListener('pointerlockchange', () => {
            if (!document.pointerLockElement && !this.isPaused) {
                this.togglePauseMenu();
            }
        });
    }

    private togglePauseMenu() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            this.pauseMenu.show(() => {
                this.resumeGame();
            });
        } else {
            this.pauseMenu.hide();
        }
    }

    private resumeGame() {
        this.isPaused = false;
        const settings = this.pauseMenu.getSettings();
        this.sensitivity = settings.sensitivity;
        this.keybinds = settings.keybinds;
        document.body.requestPointerLock();
    }

    public update() {
        const inputDirection = new THREE.Vector3();
        if (this.input.forward) inputDirection.z -= 1;
        if (this.input.backward) inputDirection.z += 1;
        if (this.input.left) inputDirection.x -= 1;
        if (this.input.right) inputDirection.x += 1;

        const yVelocity = this.body.getLinearVelocity().y();

        if (inputDirection.lengthSq() > 0) {
            inputDirection.normalize();

            // Apply movement relative to camera direction
            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3().crossVectors(this.camera.up, forward);

            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(forward, -inputDirection.z);
            moveDirection.addScaledVector(right, inputDirection.x);
            moveDirection.normalize();

            const newVelocity = new this.Ammo.btVector3(moveDirection.x * this.moveSpeed, yVelocity, moveDirection.z * this.moveSpeed);
            this.body.setLinearVelocity(newVelocity);
        } else {
            this.body.setLinearVelocity(new this.Ammo.btVector3(0, yVelocity, 0));
        }

        if (this.input.jump) {
            // A simple check to see if the player is on the ground
            // This can be improved with raycasting
            const motionState = this.body.getMotionState();
            if (motionState) {
                const transform = new this.Ammo.btTransform();
                motionState.getWorldTransform(transform);
                const pos = transform.getOrigin();
                if (pos.y() < 2) {
                     this.body.applyCentralImpulse(new this.Ammo.btVector3(0, this.jumpForce, 0));
                }
            }
            this.input.jump = false; // Consume jump input to prevent continuous jumping
        }

        const motionState = this.body.getMotionState();
        if (motionState) {
            const transform = new this.Ammo.btTransform();
            motionState.getWorldTransform(transform);
            const pos = transform.getOrigin();
            this.camera.position.set(pos.x(), pos.y(), pos.z());
        }

        // Update camera rotation based on mouse movement
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= this.mouseDelta.x;
        this.euler.x -= this.mouseDelta.y;

        // Clamp pitch to prevent flipping
        this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));

        this.camera.quaternion.setFromEuler(this.euler);
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;

        // Handle picking up objects
        if (this.input.pickup) {
            if (!this.pickedObject) {
                this.pickObject();
            }
            this.input.pickup = false;
        }

        // Handle throwing objects
        if (this.input.throw) {
            if (this.pickedObject) {
                this.throwObject();
            }
            this.input.throw = false;
        }

        // Update picked object position if holding one
        if (this.pickedObject) {
            this.updatePickedObjectPosition();
        }
    }

    private pickObject() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        
        this.raycaster.set(this.camera.position, direction);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        for (let i = 0; i < intersects.length; i++) {
            const obj = intersects[i].object as THREE.Mesh;
            
            // Skip the ground and player
            if (obj.position.y < 0.5 || !obj.userData.physicsBody) {
                continue;
            }

            // Found a pickable object
            const rigidBody = obj.userData.physicsBody;
            rigidBody.setCollisionFlags(rigidBody.getCollisionFlags() | 4); // Make kinematic
            rigidBody.setLinearVelocity(new this.Ammo.btVector3(0, 0, 0));
            rigidBody.setAngularVelocity(new this.Ammo.btVector3(0, 0, 0));

            this.pickedObject = {
                mesh: obj,
                body: rigidBody,
                originalFlags: rigidBody.getCollisionFlags()
            };
            break;
        }
    }

    private throwObject() {
        if (!this.pickedObject) return;

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const throwForce = 20;

        // Restore physics body to dynamic
        this.pickedObject.body.setCollisionFlags(this.pickedObject.originalFlags & ~4);
        this.pickedObject.body.setLinearVelocity(direction.multiplyScalar(throwForce) as any);

        this.pickedObject = null;
    }

    private updatePickedObjectPosition() {
        if (!this.pickedObject) return;

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const targetPos = this.camera.position.clone().addScaledVector(direction, this.constraintDist);

        // Smoothly move picked object towards target
        const currentPos = this.pickedObject.mesh.position;
        const diff = targetPos.sub(currentPos);
        const speed = 0.3;

        const newPos = currentPos.clone().addScaledVector(diff, speed);
        
        // Update both mesh and physics body
        this.pickedObject.mesh.position.copy(newPos);
        
        // Update physics body transform
        const transform = new this.Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.Ammo.btVector3(newPos.x, newPos.y, newPos.z));
        this.pickedObject.body.getMotionState().setWorldTransform(transform);
    }
}
