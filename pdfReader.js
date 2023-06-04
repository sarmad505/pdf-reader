const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

async function extractFormElements(pdfPath) {
    const data = new Uint8Array(await fs.promises.readFile(pdfPath));
    const doc = await pdfjsLib.getDocument(data).promise;
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
  
        // Extract the type, label, and grouping information based on your logic
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
    // Assuming a text box if the item contains text
    if (item.str.length > 0) {
      return 'TextBox';
    }
  
    // Assuming a check box if the item contains a square shape
    if (item.transform[0] === item.transform[3] && item.transform[1] === 0 && item.transform[2] === 0) {
      return 'CheckBox';
    }
  
    // Assuming a radio button if the item contains a circular shape
    if (item.transform[0] === item.transform[3] && item.transform[1] !== 0 && item.transform[2] !== 0) {
      return 'RadioButton';
    }
  
    // Return a default type if the element type cannot be determined
    return 'Unknown';
  }
  
  function extractLabel(item, items) {
    // Find the previous item that contains text and use it as the label
    const currentIndex = items.indexOf(item);
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevItem = items[i];
      if (prevItem.str.length > 0) {
        return prevItem.str;
      }
    }
  
    // If no previous text item found, return an empty string
    return '';
  }
  
  function extractGroup(item, items) {
    // Find the previous item that contains a circular shape and use it as the group
    const currentIndex = items.indexOf(item);
    for (let i = currentIndex - 1; i >= 0; i--) {
      const prevItem = items[i];
      if (prevItem.transform[0] === prevItem.transform[3] && prevItem.transform[1] !== 0 && prevItem.transform[2] !== 0) {
        return prevItem.str;
      }
    }
  
    // If no previous circular shape item found, return null
    return null;
  }

  // path of  PDF file
  const pdfPath = 'sample1.PDF'; 

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

  