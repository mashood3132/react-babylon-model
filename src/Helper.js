import * as BABYLON from "babylonjs";
import { generateTexture } from "./NoiseHelper";
import { FurMaterial } from "babylonjs-materials";

const GROUND_SIZE = 30;

/**
 * Add Smole Screen on Mesh
 * @param {*} mesh
 * @param {*} scene
 */
export const attachSmokeToMesh = (mesh, scene) => {
  BABYLON.ParticleHelper.CreateAsync("smoke", scene).then(set => {
    set.start();
    //console.log(set)
    for (var i = 0; i < set.systems.length; i++) {
      var particleSystem = set.systems[i];

      particleSystem.emitter = mesh;
      // particleSystem.gravity = new BABYLON.Vector3(0, -1, 0);
      //particleSystem.emitRate = 8000;
      //    particleSystem.direction1 = new BABYLON.Vector3(0, sphere.position.y-10, 0);
      //    particleSystem.direction2 = new BABYLON.Vector3(0,sphere.position.y -5, 0);
      //     particleSystem.minEmitBox = new BABYLON.Vector3(0, 5, 0);
      //     particleSystem.maxEmitBox = new BABYLON.Vector3(0, 2, 0);
    }
  });
};

export const attachRayOnMesh = (mesh, scene) => {
  // ADD A RAY
  var ray = new BABYLON.Ray();
  var rayHelper = new BABYLON.RayHelper(ray);
  var localMeshDirection = new BABYLON.Vector3(0, 1, 0);
  var localMeshOrigin = new BABYLON.Vector3(0, 0, 0);
  var length = 100;

  rayHelper.attachToMesh(mesh, localMeshDirection, localMeshOrigin, length);
  rayHelper.show(scene);
};
/**
 * Add Fire Particle on Mesh
 * @param {*} mesh
 * @param {*} scene
 */
export const attachFireToMesh = (mesh, scene) => {
  BABYLON.ParticleHelper.CreateAsync("fire", scene).then(set => {
    set.start();
    for (var i = 0; i < set.systems.length; i++) {
      var particleSystem = set.systems[i];
      particleSystem.emitter = mesh;
      particleSystem.direction1 = new BABYLON.Vector3(1, -1, 1);
      particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
      particleSystem.minEmitBox = new BABYLON.Vector3(0, 2, 0);
      particleSystem.maxEmitBox = new BABYLON.Vector3(0, 3, 0);
      particleSystem.gravity = new BABYLON.Vector3(1, 0, 1);
    }
  });
};

/**
 *  Create a built-in "ground" shape.
 */
export const addGround = scene => {
  //Create ground from Box
  var groundMesh = BABYLON.MeshBuilder.CreateBox(
    "ground",
    { height: 0.3, width: GROUND_SIZE, depth: GROUND_SIZE, subdivisions: 16 },
    scene
  );

  //Ground Material
  var groundMaterial = new BABYLON.StandardMaterial("grass0", scene);
  groundMaterial.diffuseTexture = new BABYLON.Texture(
    "./assets/ground.jpeg",
    scene
  );
  // groundMesh.material = groundMaterial;

  //Add Bumps
  applyBumpTexture(groundMesh, "./textures/concrete/", scene);

  //Add Grass
  //this.addGrass(groundMesh);

  //Shadow
  groundMesh.receiveShadows = true;

  //Ground Physics
  groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
    groundMesh,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 1.5, restitution: 0.7 },
    scene
  );
};

/**
 * Use HeightMap to create  a ground
 */
export const createGroundFromHeightMap = (texture, hrightMap, scene) => {
  // Ground
  var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
  groundMaterial.diffuseTexture = new BABYLON.Texture(texture, scene);

  var groundMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "gdhm",
    hrightMap,
    {
      width: GROUND_SIZE,
      height: GROUND_SIZE,
      subdivisions: 10,
      maxHeight: 10,
      minHeight: 0,
      onReady: () => {
        console.log("Ground Ready ");
        groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
          groundMesh,
          BABYLON.PhysicsImpostor.HeightmapImpostor,
          { mass: 0, restitution: 0.1 },
          scene
        );
      }
    },
    scene
  );
  groundMesh.material = groundMaterial;

  //Shadow
  groundMesh.receiveShadows = true;
  return groundMesh;
};

/**
 * Use Perlin Noise to create Ground
 */
export const createGroundFromPerlinNoise = (texture, scene) => {
  // Ground
  // var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
  // groundMaterial.diffuseTexture = new BABYLON.Texture(texture, scene);

  let data = generateTexture(GROUND_SIZE, 10, 15);

  let groundMesh = BABYLON.MeshBuilder.CreateGroundFromHeightMap(
    "gdhm",
    data,
    {
      width: GROUND_SIZE,
      height: GROUND_SIZE,
      subdivisions: 30,
      updatable: true,
      maxHeight: 5,
      minHeight: -2,
      onReady: () => {
        console.log("Ground Ready ");
        groundMesh.physicsImpostor = new BABYLON.PhysicsImpostor(
          groundMesh,
          BABYLON.PhysicsImpostor.HeightmapImpostor,
          { mass: 0, restitution: 0.1 },
          scene
        );
      }
    },
    scene
  );

  applyBumpTexture(groundMesh, texture, scene);

  //Shadow
  groundMesh.receiveShadows = true;
  return groundMesh;
};

/**
 * Create Border around ground for test
 * @param {*} scene
 * @param {*} decalEnable
 */
export const addBorder = (scene, decalEnable) => {
  var materialBorder = new BABYLON.StandardMaterial("texture2", scene);
  materialBorder.alpha = 0.3;

  let borderPx = BABYLON.MeshBuilder.CreateBox(
    "ground",
    {
      height: GROUND_SIZE / 2,
      width: 0.5,
      depth: GROUND_SIZE - 0.3,
      subdivisions: 16
    },
    scene
  );
  borderPx.position.x = GROUND_SIZE / 2;
  borderPx.position.y = GROUND_SIZE / 4 + 0.3;
  borderPx.material = materialBorder;
  borderPx.isPickable = decalEnable;
  borderPx.physicsImpostor = new BABYLON.PhysicsImpostor(
    borderPx,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 1.5, restitution: 0.7 },
    scene
  );

  let borderNx = borderPx.createInstance("Nx");
  borderNx.position.x = -GROUND_SIZE / 2;
  borderNx.position.y = GROUND_SIZE / 4 + 0.3;
  borderNx.isPickable = decalEnable;
  borderNx.physicsImpostor = new BABYLON.PhysicsImpostor(
    borderNx,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 1.5, restitution: 0.7 },
    scene
  );

  let borderPz = BABYLON.MeshBuilder.CreateBox(
    "ground",
    {
      height: GROUND_SIZE / 2,
      width: GROUND_SIZE,
      depth: 0.5,
      subdivisions: 16
    },
    scene
  );
  borderPz.isPickable = decalEnable;
  borderPz.position.z = GROUND_SIZE / 2;
  borderPz.position.y = GROUND_SIZE / 4 + 0.3;
  borderPz.physicsImpostor = new BABYLON.PhysicsImpostor(
    borderPz,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 1.5, restitution: 0.7 },
    scene
  );
  borderPz.material = materialBorder;

  let borderNz = borderPz.createInstance("Nz");
  borderNz.position.z = -GROUND_SIZE / 2;
  borderNz.position.y = GROUND_SIZE / 4 + 0.3;
  borderNz.isPickable = decalEnable;
  borderNz.physicsImpostor = new BABYLON.PhysicsImpostor(
    borderNz,
    BABYLON.PhysicsImpostor.BoxImpostor,
    { mass: 0, friction: 1.5, restitution: 0.7 },
    scene
  );
};

/**
 * Create a s spherical Sky from Panorama texture
 */
export const addPhotoSphere = (panoramaImage, scene) => {
  //Add SkyBox from URL
  var photoSphere = BABYLON.Mesh.CreateSphere("skyBox", 16.0, 50.0, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("smat", scene);
  skyboxMaterial.emissiveTexture = new BABYLON.Texture(
    panoramaImage,
    scene,
    1,
    0
  );
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.emissiveTexture.uOffset = -Math.PI / 2; // left-right
  skyboxMaterial.emissiveTexture.uOffset = 0.1; // up-down
  skyboxMaterial.backFaceCulling = false;
  photoSphere.material = skyboxMaterial;
};

/**
 * Use Skybox to create a skybox
 * @param {*} skyBoxURL
 * @param {*} scene
 */
export const addSkyBox = (skyBoxURL, scene) => {
  // Skybox
  var skybox = BABYLON.Mesh.CreateBox("skyBox", 800.0, scene);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.backFaceCulling = false;
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(skyBoxURL, scene);
  skyboxMaterial.reflectionTexture.coordinatesMode =
    BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.disableLighting = true;
  skybox.material = skyboxMaterial;
};

/**
 * Texture Experiment
 */
export const applyBumpTexture = (mesh, texture, scene) => {
  //Base Texture
  let bumpMaterial = new BABYLON.StandardMaterial("kosh", scene);
  bumpMaterial.diffuseTexture = new BABYLON.Texture(
    texture + "base.jpg",
    scene
  );

  //Bumps
  bumpMaterial.bumpTexture = new BABYLON.Texture(texture + "normal.jpg", scene);
  bumpMaterial.bumpTexture.level = 5.0;

  // brickMaterial.lightmapTexture = new BABYLON.Texture(
  //    texture+ "ambientOcclusion.jpg",
  //   scene,
  //   0,
  //   0
  // );

  //myMaterial.specularTexture = new BABYLON.Texture("PATH TO IMAGE", scene);
  //myMaterial.emissiveTexture = new BABYLON.Texture("PATH TO IMAGE", scene);

  //Ambient
  bumpMaterial.ambientTexture = new BABYLON.Texture(
    texture + "ambientOcclusion.jpg",
    scene,
    0,
    0
  );

  //Metallic ness
  bumpMaterial.roughness = 1;
  bumpMaterial.metallic = 0;

  //Color
  bumpMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);

  //Both Side
  bumpMaterial.backFaceCulling = false;

  //Transperency of Texture
  bumpMaterial.diffuseTexture.hasAlpha = true;

  //Opacity
  // brickMaterial.alpha = 0.5;

  //WireFrame
  //brickMaterial.wireframe = true;

  bumpMaterial.diffuseTexture.uScale = 5;
  bumpMaterial.diffuseTexture.vScale = 5;

  mesh.material = bumpMaterial;
};

/**
 * Appply fur ona mesh
 * @param {*} mesh
 * @param {*} scene
 */
export const addFur = (mesh, scene) => {
  var furMaterial = new FurMaterial("furD", scene);
  furMaterial.furAngle = 0;
  furMaterial.furSpeed = 1;
  furMaterial.diffuseTexture = new BABYLON.Texture(
    "https://upload.wikimedia.org/wikipedia/commons/8/8a/Leopard_fur.JPG",
    scene
  );
  furMaterial.furColor = new BABYLON.Color3(1, 1, 1);
  furMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);
  furMaterial.furLength = 0.2; // Represents the maximum length of the fur, which is then adjusted randomly. Default value is 1.
  furMaterial.furAngle = Math.PI / 6; // Represents the angle the fur lies on the mesh from 0 to Math.PI/2. The default angle of 0 gives fur sticking straight up and PI/2 lies along the mesh.
  furMaterial.furDensity = 20;
  furMaterial.furSpacing = 6;
  mesh.material = furMaterial;
  var quality = 10; // Average quality

  // Create shells
  FurMaterial.FurifyMesh(mesh, quality);
};

/**
 * Add Lens Flare on a light
 * @param {*} light
 * @param {*} scene
 */
export const addLensFlare = (light, scene) => {
  var lensFlareSystem = new BABYLON.LensFlareSystem(
    "lensFlareSystem",
    light,
    scene
  );

  new BABYLON.LensFlare(
    1,
    1,
    new BABYLON.Color3(1, 1, 1),
    "shader/lensflare0.png",
    lensFlareSystem
  );
  new BABYLON.LensFlare(
    0.5,
    0.2,
    new BABYLON.Color3(0.5, 0.5, 1),
    "shader/lensflare3.png",
    lensFlareSystem
  );
  new BABYLON.LensFlare(
    0.2,
    1.0,
    new BABYLON.Color3(1, 1, 1),
    "shader/lensflare3.png",
    lensFlareSystem
  );
  new BABYLON.LensFlare(
    0.4,
    0.4,
    new BABYLON.Color3(1, 0.5, 1),
    "shader/lensflare2.png",
    lensFlareSystem
  );
  // new BABYLON.LensFlare(
  //   0.1,
  //   0.6,
  //   new BABYLON.Color3(1, 1, 1),
  //   "shader/lensflare0.png",
  //   lensFlareSystem
  // );
  // new BABYLON.LensFlare(
  //   0.3,
  //   0.8,
  //   new BABYLON.Color3(1, 1, 1),
  //   "shader/lensflare0.png",
  //   lensFlareSystem
  // );
};
