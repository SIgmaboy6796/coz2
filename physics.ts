import * as THREE from 'three';

export function createPhysicsWorld(Ammo: any) {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
    const dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
    const overlappingPairCache = new Ammo.btDbvtBroadphase();
    const solver = new Ammo.btSequentialImpulseConstraintSolver();
    const physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -9.81, 0));

    return physicsWorld;
}

export function createRigidBody(Ammo: any, object: THREE.Mesh, shape: any, mass: number, physicsWorld: any, rigidBodies: THREE.Mesh[]) {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(object.position.x, object.position.y, object.position.z));
    transform.setRotation(new Ammo.btQuaternion(object.quaternion.x, object.quaternion.y, object.quaternion.z, object.quaternion.w));
    const motionState = new Ammo.btDefaultMotionState(transform);

    const localInertia = new Ammo.btVector3(0, 0, 0);
    if (mass > 0) {
        shape.calculateLocalInertia(mass, localInertia);
    }

    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);

    physicsWorld.addRigidBody(body);

    if (mass > 0) {
        object.userData.physicsBody = body;
        rigidBodies.push(object);
    }
}

export function updatePhysics(Ammo: any, physicsWorld: any, rigidBodies: THREE.Mesh[], deltaTime: number) {
    physicsWorld.stepSimulation(deltaTime, 10);

    for (const object of rigidBodies) {
        const motionState = object.userData.physicsBody.getMotionState();
        if (motionState) {
            const transform = new Ammo.btTransform();
            motionState.getWorldTransform(transform);
            const pos = transform.getOrigin();
            const quat = transform.getRotation();
            object.position.set(pos.x(), pos.y(), pos.z());
            object.quaternion.set(quat.x(), quat.y(), quat.z(), quat.w());
        }
    }
}