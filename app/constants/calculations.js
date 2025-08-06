const calcularPrecioUnitario = (producto, precioKilo) => {
  if (!producto || !precioKilo) return 0;
  
  const { tipo, material, ancho_cm, largo_cm, micraje_um } = producto;
  const anchoNum = parseFloat(ancho_cm) || 0;
  const largoNum = parseFloat(largo_cm) || 0;
  const micrajeNum = parseFloat(micraje_um) || 0;
  const precioKiloNum = parseFloat(precioKilo) || 0;

  switch (tipo?.toUpperCase()) {
    case "MORDAZA":
      return (((largoNum * anchoNum + 2) * 2 * micrajeNum) / 10000) * precioKiloNum;
    case "LATERAL":
      return (((largoNum * anchoNum) * 2 * micrajeNum) / 10000) * precioKiloNum;
    case "PEGOL":
      return (((largoNum * anchoNum + 3) * 2 * micrajeNum) / 10000) * precioKiloNum + (largoNum * 0.12) + 13;
    case "CENEFA + PEGOL":
      return (((largoNum * (anchoNum + 6)) * 2 * micrajeNum) / 10000) * precioKiloNum + (largoNum * 0.21) + 20;
    default:
      if (material?.toLowerCase() === "polietileno") {
        return precioKiloNum;
      }
      return precioKiloNum;
  }
};

const calcularKgPorMillar = (producto) => {
  if (!producto) return 0;
  
  const { tipo, ancho_cm, largo_cm } = producto;
  const anchoNum = parseFloat(ancho_cm) || 0;
  const largoNum = parseFloat(largo_cm) || 0;

  switch (tipo?.toUpperCase()) {
    case "MORDAZA":
      return ((largoNum * (anchoNum + 2) * 2) * 25) / 10000;
    case "LATERAL":
      return ((largoNum * anchoNum * 2) * 25) / 10000;
    case "PEGOL":
      return ((largoNum * (anchoNum + 3) * 2) * 25) / 10000;
    case "CENEFA + PEGOL":
      return ((largoNum * (anchoNum + 6) * 2) * 25) / 10000;
    default:
      return 0;
  }
};

export { calcularPrecioUnitario, calcularKgPorMillar };