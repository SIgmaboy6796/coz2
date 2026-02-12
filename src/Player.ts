import * as THREE from 'three';
import { PauseMenu, GameSettings } from '@/PauseMenu';
import { rayTest } from '@/physics';

export class Player {
    private camera: THREE.PerspectiveCamera;
    private body: any;
    private cameraMode: 'first-person' | 'third-person' = 'first-person';
    private playerModel: THREE.Mesh | null = null;
    private input = {
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false,
        pickup: false,
        throw: false,
        toggleCamera: false
    };
    private moveSpeed = 8;
    // Jump impulse scaled for player mass (~80). 400 ~= 5 m/s change in velocity.
    private jumpForce = 400;
    private jumpCooldown = 0;
    private isCrouching = false;
    private crouchHeight = 0.75;
    private standHeight = 1.5;
    private normalSpeed = 8;
    private crouchSpeed = 4;
    private mouseDelta = { x: 0, y: 0 };
    private euler = new THREE.Euler(0, 0, 0, 'YXZ');
    private sensitivity = 0.015;
    private pauseMenu: PauseMenu;
    private isPaused = false;
    private raycaster = new THREE.Raycaster();
    private pickedObject: any = null;
    private constraintDist = 1.5;
    private scene: THREE.Scene;
    private keybinds = {
        forward: 'KeyW',
        backward: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        jump: 'Space',
        pickup: 'KeyE',
        throw: 'KeyF',
        toggleCamera: 'KeyC'
    };

    private defaultSettings: GameSettings = {
        sensitivity: 0.015,
        keybinds: this.keybinds
    };

    private isHosting = false;
    private onHostingChange: ((isHosting: boolean) => void) | null = null;

    constructor(private Ammo: any, camera: THREE.PerspectiveCamera, private _physicsWorld: any, scene: THREE.Scene, _rigidBodies: THREE.Mesh[]) {
        this.camera = camera;
        this.scene = scene;
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
        this.body.setActivationState(4);
        this.body.setAngularFactor(new this.Ammo.btVector3(0, 1, 0));
        this._physicsWorld.addRigidBody(this.body);

        this.createPlayerModel();
        this.setupInput();
    }

    private createPlayerModel() {
        const geometry = new THREE.CapsuleGeometry(0.4, this.standHeight, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x4488ff });
        this.playerModel = new THREE.Mesh(geometry, material);
        this.playerModel.castShadow = true;
        this.playerModel.receiveShadow = true;
        this.scene.add(this.playerModel);
    }

    private setupInput() {
        window.addEventListener('keydown', (e) => {
            if (this.isPaused) return;
            switch (e.code) {
                case this.keybinds.forward:
                    this.input.forward = true;
                    break;
                case this.keybinds.backward:
                    this.input.backward = true;
                    break;
                case this.keybinds.left:
                    this.input.left = true;
                    break;
                case this.keybinds.right:
                    this.input.right = true;
                    break;
                case this.keybinds.jump:
                    e.preventDefault();
                    this.input.jump = true;
                    break;
                case this.keybinds.pickup:
                    this.input.pickup = true;
                    break;
                case this.keybinds.throw:
                    this.input.throw = true;
                    break;
                case this.keybinds.toggleCamera:
                    this.toggleCamera();
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.isCrouching = true;
                    break;
                case 'Escape':
                    this.togglePauseMenu();
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.code) {
                case this.keybinds.forward:
                    this.input.forward = false;
                    break;
                case this.keybinds.backward:
                    this.input.backward = false;
                    break;
                case this.keybinds.left:
                    this.input.left = false;
                    break;
                case this.keybinds.right:
                    this.input.right = false;
                    break;
                case this.keybinds.jump:
                    this.input.jump = false;
                    break;
                case this.keybinds.pickup:
                    this.input.pickup = false;
                    break;
                case this.keybinds.throw:
                    this.input.throw = false;
                    break;
                case 'ShiftLeft':
                case 'ShiftRight':
                    this.isCrouching = false;
                    break;
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

    private toggleCamera() {
        this.cameraMode = this.cameraMode === 'first-person' ? 'third-person' : 'first-person';
    }

    public update() {
        this.jumpCooldown = Math.max(0, this.jumpCooldown - 1);

        // Apply crouching effects
        this.moveSpeed = this.isCrouching ? this.crouchSpeed : this.normalSpeed;
        
        if (this.playerModel) {
            if (this.isCrouching) {
                // Scale model down when crouching
                this.playerModel.scale.y = this.crouchHeight / this.standHeight;
            } else {
                this.playerModel.scale.y = 1;
            }
        }

        const inputDirection = new THREE.Vector3();
        if (this.input.forward) inputDirection.z -= 1;
        if (this.input.backward) inputDirection.z += 1;
        if (this.input.left) inputDirection.x -= 1;
        if (this.input.right) inputDirection.x += 1;

        const yVelocity = this.body.getLinearVelocity().y();

        if (inputDirection.lengthSq() > 0) {
            inputDirection.normalize();

            const forward = new THREE.Vector3();
            this.camera.getWorldDirection(forward);
            forward.y = 0;
            forward.normalize();

            const right = new THREE.Vector3().crossVectors(forward, this.camera.up);

            const moveDirection = new THREE.Vector3();
            moveDirection.addScaledVector(forward, -inputDirection.z);
            moveDirection.addScaledVector(right, inputDirection.x);
            moveDirection.normalize();

            const newVelocity = new this.Ammo.btVector3(moveDirection.x * this.moveSpeed, yVelocity, moveDirection.z * this.moveSpeed);
            this.body.setLinearVelocity(newVelocity);
        } else {
            this.body.setLinearVelocity(new this.Ammo.btVector3(0, yVelocity, 0));
        }

        const motionState = this.body.getMotionState();
        let playerPos = new THREE.Vector3(0, 0, 0);
        if (motionState) {
            const transform = new this.Ammo.btTransform();
            motionState.getWorldTransform(transform);
            const pos = transform.getOrigin();
            playerPos = new THREE.Vector3(pos.x(), pos.y(), pos.z());

            // Update player model position
            if (this.playerModel) {
                this.playerModel.position.copy(playerPos);
            }

            if (this.cameraMode === 'first-person') {
                const cameraHeight = this.isCrouching ? 0.3 : 0.5;
                this.camera.position.copy(playerPos).add(new THREE.Vector3(0, cameraHeight, 0));
            } else {
                // Third person: camera behind and above
                const backward = new THREE.Vector3();
                this.camera.getWorldDirection(backward);
                backward.negate();
                backward.y = 0;
                backward.normalize();

                const cameraHeight = this.isCrouching ? 0.8 : 1.5;
                const cameraOffset = backward.multiplyScalar(3).add(new THREE.Vector3(0, cameraHeight, 0));
                this.camera.position.copy(playerPos).add(cameraOffset);
                this.camera.lookAt(playerPos.clone().add(new THREE.Vector3(0, 1, 0)));
            }
        }

        // Jump - simplified: can jump if cooldown is ready and not moving upward too fast
        // This allows jumping on ground, objects, and other players
            if (this.input.jump && this.jumpCooldown === 0) {
                const isMovingUpwardFast = yVelocity > 1.0; // Only prevent jump if actively jumping/moving up fast
            
                if (!isMovingUpwardFast) {
                    console.log('[Jump] ✓ JUMPING! yVel was:', yVelocity.toFixed(2), 'applying impulse:', this.jumpForce);
                    try {
                        // Ensure body is active before applying impulse
                        (this.body as any).activate && (this.body as any).activate();
                    } catch (e) {
                        // ignore
                    }
                    // Also check with Ammo ray test as secondary confirmation (via physics helper)
                    const from = new THREE.Vector3(playerPos.x, playerPos.y - 0.6, playerPos.z);
                    const to = new THREE.Vector3(playerPos.x, playerPos.y - 1.2, playerPos.z);
                    const rayRes = rayTest(this.Ammo, this._physicsWorld, from, to);
                    const rayHasHit = !!rayRes.hasHit;
                    this.body.applyCentralImpulse(new this.Ammo.btVector3(0, this.jumpForce, 0));
                    this.jumpCooldown = 3;
                } else {
                    console.log('[Jump] ✗ Moving upward too fast, yVel:', yVelocity.toFixed(2));
                }
            
                this.input.jump = false;
        }

        // Update camera rotation based on mouse movement
        this.euler.setFromQuaternion(this.camera.quaternion);
        this.euler.y -= this.mouseDelta.x;
        this.euler.x -= this.mouseDelta.y;

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

            if (!obj.userData.physicsBody) {
                continue;
            }

            const rigidBody = obj.userData.physicsBody;
            const originalFlags = rigidBody.getCollisionFlags();

            // Store original mass and inertia
            const mass = rigidBody.getInvMass() > 0 ? 1 / rigidBody.getInvMass() : 0;

            this.pickedObject = {
                mesh: obj,
                body: rigidBody,
                originalFlags: originalFlags,
                originalMass: mass,
                isKinematic: false
            };

            // Make it kinematic
            rigidBody.setCollisionFlags(originalFlags | 2);
            rigidBody.setLinearVelocity(new this.Ammo.btVector3(0, 0, 0));
            rigidBody.setAngularVelocity(new this.Ammo.btVector3(0, 0, 0));
            this.pickedObject.isKinematic = true;
            break;
        }
    }

    private throwObject() {
        if (!this.pickedObject) return;

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const throwForce = 15;

        // Restore to dynamic
        this.pickedObject.body.setCollisionFlags(this.pickedObject.originalFlags);

        const velocity = direction.clone().multiplyScalar(throwForce);
        this.pickedObject.body.setLinearVelocity(new this.Ammo.btVector3(velocity.x, velocity.y, velocity.z));

        this.pickedObject = null;
    }

    private updatePickedObjectPosition() {
        if (!this.pickedObject) return;

        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        const targetPos = this.camera.position.clone().addScaledVector(direction, this.constraintDist);

        // Directly set position for kinematic body
        const transform = new this.Ammo.btTransform();
        transform.setIdentity();
        transform.setOrigin(new this.Ammo.btVector3(targetPos.x, targetPos.y, targetPos.z));
        this.pickedObject.body.getMotionState().setWorldTransform(transform);
        this.pickedObject.mesh.position.copy(targetPos);

        // Zero velocity for kinematic objects
        this.pickedObject.body.setLinearVelocity(new this.Ammo.btVector3(0, 0, 0));
        this.pickedObject.body.setAngularVelocity(new this.Ammo.btVector3(0, 0, 0));
    }

    public getPlayerState() {
        const motionState = this.body.getMotionState();
        if (!motionState) {
            return null;
        }
        
        const transform = new this.Ammo.btTransform();
        motionState.getWorldTransform(transform);
        const pos = transform.getOrigin();
        const rot = transform.getRotation();
        
        return {
            position: { x: pos.x(), y: pos.y(), z: pos.z() },
            rotation: { x: rot.x(), y: rot.y(), z: rot.z(), w: rot.w() },
            velocity: { 
                x: this.body.getLinearVelocity().x(), 
                y: this.body.getLinearVelocity().y(), 
                z: this.body.getLinearVelocity().z() 
            }
        };
    }

    public getPlayerPosition(): THREE.Vector3 {
        const motionState = this.body.getMotionState();
        if (!motionState) {
            return new THREE.Vector3(0, 0, 0);
        }
        
        const transform = new this.Ammo.btTransform();
        motionState.getWorldTransform(transform);
        const pos = transform.getOrigin();
        return new THREE.Vector3(pos.x(), pos.y(), pos.z());
    }

    public setOnHostClick(callback: () => void) {
        this.pauseMenu.setOnHostClick(callback);
    }

    public setOnStopHostClick(callback: () => void) {
        this.pauseMenu.setOnStopHostClick(callback);
    }

    public setOnHostingChange(callback: (isHosting: boolean) => void) {
        this.onHostingChange = callback;
    }

    public setHosting(hosting: boolean) {
        this.isHosting = hosting;
        this.pauseMenu.setHostingStatus(hosting);
        if (this.onHostingChange) {
            this.onHostingChange(hosting);
        }
    }

    public isGameHosting(): boolean {
        return this.isHosting;
    }

    public showMultiplayerShareLink(url: string) {
        this.pauseMenu.showShareLink(url);
    }
}
