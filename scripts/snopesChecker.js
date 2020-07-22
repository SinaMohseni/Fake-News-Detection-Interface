const snopesFolder = '../xai_snopes_v1.0/xai_snopes';
const fs = require('fs');

let fileList = [];

let claims = [];

fs.readdir(snopesFolder, (err, files) => {
  files.forEach(file => {
    //console.log(file);
    fileList.push(file);
  });
  filesComplete();
});

function filesComplete() {
  console.log("files: "+fileList.length);
  let first = fileList[0];
  //fileList = [first];
  countAllArticles();

  console.log("files: "+fileList.length);
  console.log("claims: "+claims.length);

  setTimeout(checkComplete, 400);
}

function checkComplete()
{
  if(fileList.length > claims.length)
  {
    setTimeout(checkComplete, 400);
    console.log(claims.length);
  }
  else{
    console.log("done goign thru claims");
    printClaimData()
  }
}

// Credibility
// articles

function countAllArticles() {
  fileList.forEach(file => {
    fs.readFile(snopesFolder + '/'+file, 'utf8', (err, contents) => {
      if(claimKeys.length == 0)
        setClaimKeys(JSON.parse(contents));

      readClaim(JSON.parse(contents));
    });
  });
}

let claimKeys = [];
function setClaimKeys(claimObj) {
  for(let k in claimObj)
  {
    if(claimKeys.indexOf(k) == -1)
    {
      //console.log("new Key: "+ k);
      claimKeys.push(k);
    }
  }
}

let creds = [];
function readClaim(claimObj) {
  let hasAll = false;
  let hasNew = false;

  let keys = 0;
  for(let k in claimObj)
  {
    keys++;
    if(claimKeys.indexOf(k) == -1)
    {
      console.log("unknown Key: "+ k);
      hasNew = true;
    }
  }

  if(!hasNew && keys != claimKeys.length)
  {
    console.log("missing keys");
  }

  let cred = claimObj.Credibility;
  if(creds.indexOf(cred) == -1)
  {
    console.log("new cred: "+cred);
    creds.push(cred);
  }

  let claim = {
    credibility: claimObj.Credibility,
    articles: claimObj.Articles_crawled.length
  };
  //console.log("adding claim");
  claims.push(claim);
}

function printClaimData()
{
  console.log("claims,"+claims.length);
  let credCounts = new Map();

  let articleCounts = new Map();

  for(let c of claims)
  {
    if(credCounts.has(c.credibility))
      credCounts.set(c.credibility, credCounts.get(c.credibility) + 1);
    else
      credCounts.set(c.credibility, 1);

    if(articleCounts.has(c.articles))
      articleCounts.set(c.articles, articleCounts.get(c.articles) + 1);
    else
      articleCounts.set(c.articles, 1);
  }

  for(let i of credCounts.keys())
  {
    console.log(i + ","+credCounts.get(i));
  }

  console.log("articles");
  for(let i of articleCounts.keys())
  {
    console.log(i + ","+articleCounts.get(i));
  }

}
