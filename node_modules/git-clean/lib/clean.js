/**
 * Created by jherr on 4/24/2015.
 */
var sys = require('sys');
var child = require('child_process');
var async = require('async');
var exec = child.exec;
var args = process.argv.slice(2);
var envVar = {
    delMethod: '-d',
    dryRun: false,
    error: false,
    help: false,
    path: '',
    verbose: false
};

var validPath = function (path) {
    var reg = new RegExp("^(/)?([^/\0]+(/)?)+$");
    return reg.test(path);
};
process.cwd();


var local = function (cb) {
    if (envVar.verbose) console.log("Polling local ");
    var proc = exec('git for-each-ref --format="%(refname) %(upstream)" refs/heads', function (error, stdout, stderr) {
        if (error) {
            console.log('exec error: ' + error);
            return cb(error, null);
        } else if (stderr) {
            console.log('exec error: ' + stderr);
            return cb(stderr, null);
        } else if (stdout) {
            var temp = stdout.split('\n');
            var result = [];
            temp.map(function (a) {
                var vars = a.split(" ");
                if (vars[1]){
                    if (envVar.verbose && vars && vars[0] && typeof vars[0] === 'string') console.log("found local branch: " + vars[0].replace("refs/heads/", ""));
                    result.push({
                        local: vars[0].replace("refs/heads/", ""),
                        remote: vars[1].replace("refs/remotes/origin/", "")
                    });
                    return;
                };
            });
            cb(null, result);
        }
    });
};
var remote = function (cb) {
    if (envVar.verbose) console.log("Polling remote ");
    exec('git ls-remote --heads', function (error, stdout, stderr) {
        if (error) {
            console.log('exec error: ' + error);
            return cb(error, null);
        } else if (stderr && stderr.indexOf('From') !== 0) {
            console.log('exec error: ' + stderr);
            return cb(stderr, null);
        } else if (stdout) {
            var temp = stdout.split('\n');
            var result = [];
            temp.filter(function (a) {
                var vars = a.split("\t");
                if (envVar.verbose && vars && vars[1] && typeof vars[1] === 'string') console.log("found remote branches: " + vars[1].replace("refs/heads/", ""));
                if (vars[1]) {
                    result.push({remote: vars[1].replace("refs/heads/", "")});
                    return a;
                }
            });
            cb(null, result);
        }
    });
};

var processCommand = function () {
    local(function (err, localResult) {
        if (err) {
            return (err);
        }
        remote(function (err, remoteResult) {
            if (err) {
                return (err);
            }
            var branchesToDelete = [];
            localResult.forEach(function (res) {
                if (remoteResult.filter(function (a) {if (res.remote === a.remote) return a;}).length === 0) {
                    branchesToDelete.push(res.local);
                }
            });
            if (envVar.dryRun) {
                if (branchesToDelete.length === 0) console.log("No branches to clean");
                else {
                    console.log("Branches that would be deleted:");
                    branchesToDelete.forEach(function (branch) {
                        console.log(branch);
                    });
                }
            } else {
                if (branchesToDelete.length === 0) console.log("No branches to clean");
                async.eachLimit(branchesToDelete, 1, function (branch, asyncCb) {
                    if (envVar.verbose) console.log("Removing branch: " + branch);
                    exec('git branch ' + envVar.delMethod + ' ' + branch, function (error) {
                        asyncCb(error);
                    });
                }, function (err) {
                    if (err) console.log(err);
                });
            }
        });
    });
};

module.exports.main = function () {

    args.forEach(function (arg) {
        if (arg === "-h") {
            envVar.help = true;
            return;
        }
        if (arg === "-dr") {
            envVar.dryRun = true;
            return;
        }
        if (arg.indexOf('-path=') >= 0) {
            envVar.path= arg.split('=')[1];
            return;
        }
        if (arg === "-v") {
            envVar.verbose = true;
            return;
        }
        if (arg === "-D") {
            envVar.delMethod = arg;
            return;
        }
        envVar.error = true;
        envVar.help = true;
        return;
    });
    if (envVar.error) {
        console.log("The parameters sent in were wrong.")
    }
    if (envVar.help) {
        console.log("\nUsage for git clean local\n\n    -h      help\n    -dr     invokes a dry run\n"+
            "    -path=  overrides folder for the git directory to be cleaned\n    -v      executes verbose mode\n" + "" +
            "    -D      force branch deletion");
        return;
    }
    if (validPath(envVar.path)) {
        process.chdir(envVar.path);
        processCommand();
    } else {
        processCommand();
    }
};