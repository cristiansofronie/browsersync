const url = 'https://en.wikipedia.org/wiki/Special:Search?search=' +
  encodeURIComponent('world war two')

fetch(url)
  .then(response => response.text())
  .then(txt =>  {
    const dom = new DOMParser().parseFromString(txt, 'text/html');
    const paragraphs  = [];
    const elem = dom.querySelector('.mw-parser-output > p');
    while (!elem.matches('#toc')) {
      paragraphs.push(elem);
      elem = elem.nextElementSibling;
    }

    paragraphs.forEach(para => {
      console.log(para.innerText);
    });
  });
