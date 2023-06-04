const fs = require('fs');
const pdf = require('pdf-parse');
// pdf file path
 let dataBuffer = fs.readFileSync('sample.PDF');
 
pdf(dataBuffer).then(function(data) {
 
    // number of pages
    console.log("Number of pages",data.numpages);
    // number of rendered pages
    console.log(data.numrender);
    // PDF info
    console.log(data.info);
    // PDF metadata
    console.log(data.metadata); 
    // PDF.js version
    
    console.log(data.version);
    // PDF text
    console.log(data.text); 
        
});