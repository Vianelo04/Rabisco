// Câmera lateral que segue o jogador com suavização e um pouco de antecipação.
import { UniversalCamera, Vector3 } from "@babylonjs/core";

const DISTANCIA = 13.5;

export function criarCamera(scene) {
  const camera = new UniversalCamera("camera", new Vector3(0, 3, -DISTANCIA), scene);
  camera.fov = 0.78;
  camera.minZ = 0.1;
  camera.inputs.clear(); // o mouse é do desenho, não da câmera

  const foco = new Vector3();
  const alvo = new Vector3();
  let olhar = 0;

  return {
    camera,
    foco,
    /**
     * @param {Vector3} pos posição do jogador
     * @param {number} direcao -1 / 1 para onde ele olha
     */
    seguir(pos, direcao, dt, instantaneo = false) {
      olhar += (direcao * 2.5 - olhar) * Math.min(1, dt * 2);
      const tx = pos.x + olhar;
      const ty = Math.max(pos.y + 1.6, 1.5);
      const k = instantaneo ? 1 : 1 - Math.exp(-dt * 5);
      foco.x += (tx - foco.x) * k;
      foco.y += (ty - foco.y) * k;
      camera.position.set(foco.x, foco.y + 1.2, -DISTANCIA);
      alvo.set(foco.x, foco.y, 0);
      camera.setTarget(alvo);
    },
  };
}
