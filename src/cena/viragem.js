import { MeshBuilder, Mesh, Vector3, Animation, CubicEase, EasingFunction, StandardMaterial, Color3 } from "@babylonjs/core";
import { texturaPautada, TAMANHO_AZULEJO } from "./papel.js";

const LARGURA = 20;
const ALTURA = 13;

export function virarPagina(scene, camera) {
  const pagina = MeshBuilder.CreatePlane("paginaVirando", { width: LARGURA, height: ALTURA, sideOrientation: Mesh.DOUBLESIDE }, scene);
  const mat = new StandardMaterial("matPaginaVirando", scene);
  const tex = texturaPautada(scene);
  tex.uScale = LARGURA / TAMANHO_AZULEJO;
  tex.vScale = ALTURA / TAMANHO_AZULEJO;
  mat.diffuseTexture = tex;
  mat.emissiveColor = new Color3(0.75, 0.74, 0.7);
  mat.specularColor = Color3.Black();
  pagina.material = mat;

  pagina.parent = camera;
  pagina.position = new Vector3(2.2, 0, 9);
  pagina.setPivotPoint(new Vector3(-LARGURA / 2, 0, 0));
  pagina.rotation.y = Math.PI / 2;

  const anim = new Animation("virar", "rotation.y", 60, Animation.ANIMATIONTYPE_FLOAT, Animation.ANIMATIONLOOPMODE_CONSTANT);
  anim.setKeys([
    { frame: 0, value: Math.PI / 2 },
    { frame: 70, value: 0 },
  ]);
  const suave = new CubicEase();
  suave.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
  anim.setEasingFunction(suave);
  pagina.animations = [anim];

  return new Promise((resolver) => {
    scene.beginAnimation(pagina, 0, 70, false, 1, () => resolver(pagina));
  });
}
