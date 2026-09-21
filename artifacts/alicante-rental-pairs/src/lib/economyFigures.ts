export function parseEconomyFigure(value: string) {
  const [figure, marker] = value.split('|');
  return {
    figure,
    isGuesstimate: marker === 'guesstimate',
  };
}