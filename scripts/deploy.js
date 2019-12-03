const ghpages = require('gh-pages');

ghpages.publish('dist', {
    message: 'auto-deployed by gh-pages'
});
