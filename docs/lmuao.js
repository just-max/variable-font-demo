/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

function renderLMU(text, weightFrom, weightTo) {
  return Array.from(text).map((char, i) => {
    const weight = mapRange(i, 0, text.length - 1, weightFrom, weightTo);
    const spanEl = document.createElement('span');
    spanEl.style.fontVariationSettings = `"wght" ${weight}`;
    spanEl.append(document.createTextNode(char));
    return spanEl;
  });
}

function setupOptions(textInput, weightRangeInput, fontSizeRangeInput, lmuText, fontPath, mapMargin) {
  const fontP = opentype.load(fontPath);
  fontP.catch(console.error);

  const weightSlider = noUiSlider.create(weightRangeInput, {
    range: {
      'min': 100,
      'max': 900
    },

    step: 1,

    start: [ 200, 800 ],

    connect: true
  });

  const fontSizeSlider = noUiSlider.create(fontSizeRangeInput, {
    range: {
      'min': 8,
      'max': 512
    },

    step: 1,

    start: [ 150 ],

    connect: [ true, false ]
  });

  function updateText() {
    const text = textInput.value.length > 0 ? textInput.value : 'LMAO';
    while (lmuText.firstChild) { lmuText.firstChild.remove(); }
    lmuText.append(...renderLMU(text, ...weightSlider.get(true)));

    fontP.then(font => {
      const yMin = font.stringToGlyphs(text)
        .map(g => g.yMin).filter(x => x !== undefined).reduce((x, y) => Math.min(x, y), 0);
      console.log(yMin);
      lmuText.style.marginBottom = mapMargin(yMin);
    }, () => {});
  }

  textInput.addEventListener('input', () => updateText());
  weightSlider.on('update', () => updateText());

  fontSizeSlider.on('update', (values) => {
    lmuText.style.fontSize = `${values[0]}px`;
  });
}

function setup() {
  setupOptions(
    ...['lmu-options-text', 'lmu-options-weight', 'lmu-options-font-size', 'lmu-text-main']
      .map(t => document.getElementById(t)),
    '/worksans.ttf',
    yMin => `${mapRange(yMin, -10, -215, -0.0625, 0.125)}em`); // trial and error
}

window.addEventListener('DOMContentLoaded', _ => setup());

function mapRange(x, from1, to1, from2, to2) {
  return (x - from1) * (to2 - from2) / (to1 - from1) + from2;
}
