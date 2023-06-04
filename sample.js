const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

async function extractFormElements(pdfPath) {
    const data = new Uint8Array(await fs.promises.readFile(pdfPath));
  const doc = await pdfjsLib.getDocument({ data });
  const numPages = doc.numPages;
  const elements = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const { width, height } = viewport;

    for (const item of content.items) {
      const { str, transform } = item;
      const { width: itemWidth, height: itemHeight, transform: itemTransform } = transform;
      const position = {
        x: itemTransform[4] / width * 100,
        y: (height - itemTransform[5]) / height * 100
      };
      const dimensions = {
        width: itemWidth / width * 100,
        height: itemHeight / height * 100
      };

      const elementType = extractElementType(item);
      const label = extractLabel(item, content.items);
      const group = extractGroup(item, content.items);

      const element = {
        type: elementType,
        position,
        dimensions,
        label,
        group,
        page: pageNum.toString()
      };

      elements.push(element);
    }
  }

  return elements;
}

function extractElementType(item) {
  if (item.str.length > 0) {
    return 'TextBox';
  }

  if (item.transform[0] === item.transform[3] && item.transform[1] === 0 && item.transform[2] === 0) {
    return 'CheckBox';
  }

  if (item.transform[0] === item.transform[3] && item.transform[1]!== 0 && item.transform[2]!== 0) {
    return 'RadioButton';
  }

  return 'Unknown';
}

function extractLabel(item, items) {
  const currentIndex = items.indexOf(item);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevItem = items[i];

    if (prevItem.str.length > 0) {
      return prevItem.str;
    }
  }

  return '';
}

function extractGroup(item, items) {
  const currentIndex = items.indexOf(item);

  for (let i = currentIndex - 1; i >= 0; i--) {
    const prevItem = items[i];

    if (prevItem.transform[0] === prevItem.transform[3] && prevItem.transform[1]!== 0 && prevItem.transform[2]!== 0) {
      return prevItem.str;
    }
  }

  return null;
}
// path of pdf file
const pdfPath = 'sample.PDF';

extractFormElements(pdfPath)
 .then(elements => {
    const result = { elements };
    const jsonPath = pdfPath.replace(/\.pdf$/, '.json');
    fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2));
    console.log(`Extraction completed. JSON file saved at ${jsonPath}`);
  })
 .catch(error => {
    console.error('An error occurred:', error);
  });