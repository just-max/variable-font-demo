/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 */

// https://www.unicode.org/reports/tr18/#Line_Boundaries
const lines = s => s.split(/\r\n|(?!\r\n)[\n-\r\x85\u2028\u2029]/);
const isLineBoundary = s => /^(\r\n|[\n-\r\x85\u2028\u2029])$/.test(s);

const splitter = new GraphemeSplitter();
const graphemes = s => splitter.splitGraphemes(s);

const intersperse = (arr, sep) => arr.flatMap(x => [sep, x]).slice(1);

function renderLMU(text, weightFrom, weightTo) {
  const textGraphemes = graphemes(text);
  const regularGraphemeCount = textGraphemes.filter(g => !isLineBoundary(g)).length;

  function spanEl(spanText) {
    const spanEl = document.createElement('span');
    spanEl.append(document.createTextNode(spanText));
    return spanEl;
  }

  let regularGraphemeI = 0;
  const result = [];
  for (const grapheme of textGraphemes) {
    const weight = regularGraphemeCount == 1 ?
      weightFrom : mapRange(regularGraphemeI, 0, regularGraphemeCount - 1, weightFrom, weightTo);
    const el = spanEl(grapheme);
    if (!isLineBoundary(grapheme)) {
      regularGraphemeI += 1;
      el.style.fontVariationSettings = `"wght" ${weight}`;
    }
    result.push(el);
  }
  result.push(document.createElement('wbr')); // add a <wbr> so a trailing new-line doesn't get ignored
  return result;
}

function boundingBoxVerticalExtremum(font, text, max) {
  const glyphs = font.stringToGlyphs(text)
    .map(g => max ? g.yMax : g.yMin)
    .filter(x => x !== undefined);
  return glyphs.length == 0
    ? null
    : glyphs.reduce((x, y) => (max ? Math.max : Math.min)(x, y));
}

const boundingBoxVerticalMax = (font, text) => boundingBoxVerticalExtremum(font, text, true);
const boundingBoxVerticalMin = (font, text) => boundingBoxVerticalExtremum(font, text, false);

function setupOptions(textInput, weightRangeInput, fontSizeRangeInput, lmuText, fontPath, mapMarginTop, mapMarginBottom, textWhenEmpty = 'LMAO') {

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
      'min': 2,
      'max': 512
    },
    step: 1,
    start: [ 150 ],
    connect: [ true, false ]
  });

  function updateText() {
    const text = textInput.value.length > 0 ? textInput.value : textWhenEmpty;
    while (lmuText.firstChild) { lmuText.firstChild.remove(); }
    lmuText.append(...renderLMU(text, ...weightSlider.get(true)));
    
    fontP.then(font => {
      const textLines = lines(text);
      const firstLineYMax = boundingBoxVerticalMax(font, textLines[0]);
      const lastLineYMin = boundingBoxVerticalMin(font, textLines[textLines.length - 1]);

      // console.log(firstLineYMax, lastLineYMin);

      lmuText.style.marginTop = mapMarginTop(firstLineYMax);
      lmuText.style.marginBottom = mapMarginBottom(lastLineYMin);
      const styles = window.getComputedStyle(lmuText);
      // we really want to set the height, but that overrides aspect-ratio in chrome
      // instead just set the width, add min-width: max-content takes over if width is too small
      lmuText.parentElement.style.width =
        `${lmuText.clientHeight + parseFloat(styles['margin-top']) + parseFloat(styles['margin-bottom'])}px`;
    }, () => {});
  }

  textInput.addEventListener('input', () => updateText());
  weightSlider.on('update', () => updateText());

  fontSizeSlider.on('update', (values) => {
    lmuText.style.fontSize = `${values[0]}px`;
    updateText();
  });
}

function setup() {
  function updateParentValue(target) { target.parentNode.dataset.value = target.value; }
  for (const sizedInput of document.getElementsByClassName('input-sized')) {
    sizedInput.addEventListener('input', e => { updateParentValue(e.target); });
    updateParentValue(sizedInput);
  }

  setupOptions(
    ...['lmu-options-text', 'lmu-options-weight', 'lmu-options-font-size', 'lmu-text-main']
      .map(t => document.getElementById(t)),
    'worksans.ttf',
    yMax => yMax === null ? '0em' : `${mapRange(yMax, 730, 120, 0, -0.75)}em`, // trial and error, defined in terms of height of l (730 -> 0em) and . (120 -> -0.75em)
    yMin => yMin === null ? '0.125em' : `${mapRange(yMin, -10, -215, -0.0625, 0.125)}em` // trial and error, defined in terms of height of o (-10 -> -0.0625em) and y (-215 -> 0.125em)
  );
}

window.addEventListener('DOMContentLoaded', _ => setup());

function mapRange(x, from1, to1, from2, to2) {
  return (x - from1) * (to2 - from2) / (to1 - from1) + from2;
}
