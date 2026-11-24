import { HemisphericLight, DirectionalLight, ShadowGenerator, Vector3, Color3 } from "@babylonjs/core";

export function criarIluminacao(scene) {
  const ambiente = new HemisphericLight("ambiente", new Vector3(0, 1, -0.4), scene);
  ambiente.intensity = 0.5;
  ambiente.groundColor = new Color3(0.62, 0.6, 0.56);

  const direcao = new Vector3(0.35, -0.75, 0.55).normalize();
  const luminaria = new DirectionalLight("luminaria", direcao, scene);
  luminaria.intensity = 0.7;
  luminaria.autoUpdateExtends = false;
  luminaria.shadowFrustumSize = 44;
  luminaria.shadowMinZ = 1;
  luminaria.shadowMaxZ = 80;

  const sombras = new ShadowGenerator(2048, luminaria);
  sombras.usePercentageCloserFiltering = true;
  sombras.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
  sombras.setDarkness(0.35);
  sombras.bias = 0.0015;

  return {
    sombras,
    seguir(alvo) {
      luminaria.position.copyFrom(alvo).subtractInPlace(direcao.scale(35));
    },
  };
}
