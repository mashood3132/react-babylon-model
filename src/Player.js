import * as BABYLON from "babylonjs";
import * as Loader from "babylonjs-loaders";

//keyCode
const W = 87;
const S = 83;
const A = 65;
const D = 68;
const SPACE = 32;
const ENTER = 13;
var currentAnimation = 0;
const dance = 0;
const death = 1;
const stay = 2;
const jump = 3;
const parker = 11;
const no = 4;
const yes = 13;
const fight = 5;
const run = 6;
const walk = 10;
const sit = 7;
const thumbsUp = 9;
const salute = 12;
var inputMap = {};
export default class Player {
  constructor() {
    this.power = 1;
    this.speed = new BABYLON.Vector3();
    this.maxSpeed = 30;
    this.turnSpeed = 0;
    this.maxTurnSpeed = 2;
    this.turnAcceleration = 40;
  }

  /**
   * Load Model fro Player
   */
  loadModel = (modelUrl, scene, camera) => {
    // Trees
    var loader = BABYLON.SceneLoader;
    loader.ImportMesh(
      "",
      "./models/",
      modelUrl,
      scene,
      (newMeshes, particleSystems, skeletons, animationGroups) => {
        this.playerMesh = newMeshes[0];
        this.playerMesh.rotationQuaternion = new BABYLON.Quaternion();
        this.playerMesh.rotation.y = Math.PI / 2;

        var axis = new BABYLON.Vector3(0, 1, 0);
        var angle = Math.PI;
        var quaternion = new BABYLON.Quaternion.RotationAxis(axis, angle);
        this.playerMesh.rotationQuaternion = quaternion;

        var skeleton = skeletons[0];
        this.animations = animationGroups;
        console.log(this.animations.length);

        camera.parent = this.playerMesh;
        camera.position.copyFrom(
          this.playerMesh.position
            .subtract(this.playerMesh.forward.scale(5))
            .add(new BABYLON.Vector3(0, 10.6, 0))
        );
        camera.setTarget(this.playerMesh.position);

        // dude.position.x = i * 3;
        // dude.position.z = (i % 2) * 5;
        //robo.position.x= i%5

        //dude.position.y = 10;
        // dude.physicsImpostor = new BABYLON.PhysicsImpostor(
        //   boxMesh,
        //   BABYLON.PhysicsImpostor.BoxImpostor,
        //   { mass: 5, friction: 1, restitution: 0.5 },
        //   scene
        // );

        // shadowGenerator.addShadowCaster(dude);
      }
    );
  };

  update = (deltaTime, camera) => {
    if (inputMap["w"] || inputMap["ArrowUp"]) {
      this.speed.z += this.power * deltaTime;
      this.playAnimation(run, true);
      //this.playerMesh.position.z += this.speed.z;
    }
    if (inputMap["s"] || inputMap["ArrowDown"]) {
      this.speed.set(0, 0, 0);
      this.playAnimation(stay, true);
    }
    if (inputMap["d"] || inputMap["ArrowRight"]) {
      this.turnSpeed += this.turnAcceleration * deltaTime;
      this.playerMesh.rotationQuaternion.multiplyInPlace(
        BABYLON.Quaternion.RotationAxis(
          new BABYLON.Vector3(0, 1, 0),
          this.turnSpeed * deltaTime
        )
      );
    }
    if (inputMap["a"] || inputMap["ArrowLeft"]) {
      this.turnSpeed -= this.turnAcceleration * deltaTime;
      this.playerMesh.rotationQuaternion.multiplyInPlace(
        BABYLON.Quaternion.RotationAxis(
          new BABYLON.Vector3(0, 1, 0),
          this.turnSpeed * deltaTime
        )
      );
    }
    if (
      !(inputMap["d"] || inputMap["ArrowRight"]) &&
      !(inputMap["a"] || inputMap["ArrowLeft"])
    ) {
      this.turnSpeed = 0;
    }
    if (Math.abs(this.turnSpeed) > this.maxTurnSpeed) {
      this.turnSpeed = BABYLON.Scalar.Sign(this.turnSpeed) * this.maxTurnSpeed;
    }

    if (this.speed.length() > this.maxSpeed) {
      this.speed.normalize().scaleInPlace(this.maxSpeed);
    }

    var mat = new BABYLON.Matrix();
    if (this.playerMesh && this.playerMesh.rotationQuaternion) {
      this.playerMesh.rotationQuaternion.toRotationMatrix(mat);
      this.playerMesh.position.subtractInPlace(
        BABYLON.Vector3.TransformCoordinates(this.speed.scale(deltaTime), mat)
      );
    }

    // if (this.playerMesh && this.playerMesh.position) {
    //   camera.position.copyFrom(
    //     this.playerMesh.position
    //       .subtract(this.playerMesh.forward.scale(5))
    //       .add(new BABYLON.Vector3(0, 10.6, 0))
    //   );
    //   camera.setTarget(this.playerMesh.position);
    // }
  };

  addControls = scene => {
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        evt => {
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
        }
      )
    );
    scene.actionManager.registerAction(
      new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        evt => {
          inputMap[evt.sourceEvent.key] = evt.sourceEvent.type === "keydown";
        }
      )
    );
    // // Game/Render loop
    // scene.onBeforeRenderObservable.add(() => {
    //   // this.update(scene.getEngine().getDeltaTime() / 1000);
    //   // if (inputMap["w"] || inputMap["ArrowUp"]) {
    //   //   this.playerMesh.position.z += 0.1;
    //   //   this.playAnimation(run, true);
    //   // }
    //   // if (inputMap["a"] || inputMap["ArrowLeft"]) {
    //   //   this.playerMesh.position.x -= 0.1;
    //   // }
    //   // if (inputMap["s"] || inputMap["ArrowDown"]) {
    //   //   this.playerMesh.position.z -= 0.1;
    //   //   this.playAnimation(stay, false);
    //   // }
    //   // if (inputMap["d"] || inputMap["ArrowRight"]) {
    //   //   this.playerMesh.position.x += 0.1;
    //   // }
    // });
  };

  /**
   * Play Animation
   */
  playAnimation = (nextAnimation, repeat) => {
    if (currentAnimation !== nextAnimation) {
      if (this.animations && this.animations[nextAnimation]) {
        this.animations[currentAnimation].stop();
        this.animations[nextAnimation].start(repeat);
      }
    }
  };
}
