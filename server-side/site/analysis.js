var esprima = require("esprima");
var options = {tokens:true, tolerant: true, loc: true, range: true };
var fs = require("fs");

var builders = {};

var maxFuncLineThreshold = 5;
var maxLinesOfCodeThreshold = 10;
var maxConditionsThreshold = 5;
function main()
{
	var analysisFolder = __dirname;
	findFile(analysisFolder);
	for(var i=0;i<jsFiles.length;i++)
	{
		var file = jsFiles[i];
		complexity(file);
	}
	// Report
			for( var node in builders )
				{
					
					var builder = builders[node];
					builder.report();
				}
}

var findFile, jsFiles, rootDir;
	jsFiles = [];
	findFile = function(analysisFolder)
		{
			fs.readdirSync(analysisFolder).forEach(function(file) {
				var stat;
				stat = fs.statSync("" + analysisFolder + "/" + file);
				if (stat.isDirectory() && file!='node_modules')
				{
					findFile("" + analysisFolder + "/" + file);
				}
				else if (file.split('.').pop() === 'js')
				{
					jsFiles.push("" + analysisFolder + "/" + file);
				}
			});
		}



// Represent a reusable "class" following the Builder pattern.
function FunctionBuilder()
{
	this.StartLine = 0;
	this.FunctionName = "";
	// The number of parameters for functions
	this.ParameterCount  = 0,
	// Number of if statements/loops + 1
	this.SimpleCyclomaticComplexity = 0;
	// The max depth of scopes (nested ifs, loops, etc)
	this.MaxNestingDepth    = 0;
	// The max number of conditions in one decision statement.
	this.MaxConditions      = 0;
	// Lines in a function
	this.LineCount = 0;

	this.report = function()
	{
		console.log(
		   (
		   	"{0}(): {1}\n" +
		   	"============\n" +
				 "LineCount: {2}\t" +
				"MaxConditions: {3}\t" +
				" ---- {4}"
			)
			.format(this.FunctionName, this.StartLine,
						 this.LineCount,this.MaxConditions,
						 (this.LineCount > maxFuncLineThreshold)|| (this.MaxConditions > maxConditionsThreshold)? 'failure':'success')
		);
	}
};

// A builder for storing file level information.
function FileBuilder()
{
	this.FileName = "";
	// Number of strings in a file.
	this.Strings = 0;
	// Number of imports in a file.
	this.ImportCount = 0;

	this.report = function()
	{
		console.log (
			( "{0}\n" +
			  "~~~~~~~~~~~~\n"+
			  "TotalLinesOfCode {1}\t" +
				" ---- {2}\n"
			).format( this.FileName, this.totalLines, this.totalLines > maxLinesOfCodeThreshold? 'failure':'success' ));
	}
}

// A function following the Visitor pattern.
// Annotates nodes with parent objects.
function traverseWithParents(object, visitor)
{
    var key, child;

    visitor.call(null, object);

    for (key in object) {
        if (object.hasOwnProperty(key)) {
            child = object[key];
            if (typeof child === 'object' && child !== null && key != 'parent') 
            {
            	child.parent = object;
					traverseWithParents(child, visitor);
            }
        }
    }
}

function complexity(filePath)
{
	var buf = fs.readFileSync(filePath, "utf8");
	var ast = esprima.parse(buf, options);

	var i = 0;

	// A file level-builder:
	var fileBuilder = new FileBuilder();
	fileBuilder.FileName = filePath;
	builders[filePath] = fileBuilder;

	var codeBodyLength = ast.body.length;
	var lastLine = ast.body[codeBodyLength-1].loc.start.line;
	fileBuilder.totalLines = lastLine;

	// Tranverse program with a function visitor.
	traverseWithParents(ast, function (node) 
	{
		if (node.type === 'FunctionDeclaration') 
		{
			getFunctionLines(node);

		}
		if(node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' != null && node.expression.arguments != null){
			var funcArgs = node.expression.arguments;
			for(var i = 0; i < funcArgs.length; i++){
				if( funcArgs[i].type === 'FunctionExpression'){
					getFunctionLines(funcArgs[i]);
				}
			}
		}

			if(node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' != null && node.expression.right != null  && node.expression.right.type === 'FunctionExpression'){
				getFunctionLines(node.expression.right);
	}

	});

}
function getConditionsCount(node)
{
	if(node==null || node.left==null && node.right==null)
	return 0;
	return 1+ getConditionsCount(node.left) + getConditionsCount(node.right);
	
}

function getFunctionLines(node){
	var builder = new FunctionBuilder();

		builder.FunctionName = functionName(node);
		builder.StartLine    = node.loc.start.line;
		builder.ParameterCount = node.params.length;
		builder.LineCount = node.body.body.length;
		builders[builder.FunctionName] = builder;
		var maxIfLines = 0;
		var maxConditions = 0;
		traverseWithParents(node, function (child) 
		{
			if (child.type === 'IfStatement') 
			{
					child=child.test;
					var count= getConditionsCount(child);
					if(count==0)
						count=1;
					if(count>maxConditions)
						maxConditions=count;

				var count = getIfLines(child);
				maxIfLines += count;
			}

			if(child.type === 'ExpressionStatement' && child.expression.type === 'CallExpression' && child.expression.arguments != null){
					var funcArgs = child.expression.arguments;
					for(var i = 0; i < funcArgs.length; i++){
						if( funcArgs[i].type == 'FunctionExpression'){
							getFunctionLines(funcArgs[i]);
						}
					}
			}
			if(child.type === 'ExpressionStatement' && child.expression.type === 'AssignmentExpression' != null && child.expression.right != null  && child.expression.right.type === 'FunctionExpression'){
				getFunctionLines(child.expression.right);
			}

		});
		builder.MaxConditions=maxConditions;
		builder.LineCount += maxIfLines;
}

function getIfLines(child) 
			{
				var line = 0;
				if(child.consequent === 'BlockStatement'){
					var ifBody = child.consequent.body;
					line += ifBody.length;
					for(var i = 0; i < ifBody.length; i++){
						if(ifBody[i].type === 'IfStatement'){
							line += getIfLines(ifBody[i]);
						}
					}
				}
				else{
					line++;
				}
				if(child.alternate != null){

					//	line += ifBody.length+1;
						if(child.alternate.type === 'IfStatement'){
							line += getIfLines(child.alternate);
						}
						else if(child.alternate === 'BlockStatement'){
							ifBody = child.alternate.body;
							line += ifBody.length+1;
							for(var i = 0; i < ifBody.length; i++){
								if(ifBody[i].type == 'IfStatement'){
									line += getIfLines(ifBody[i]);
								}
							}
						}
						else{
							line++;
						}
					}
	
					return line;
				}
// Helper function for printing out function name.
function functionName( node )
{
	if( node.id )
	{
		return node.id.name;
	}
	return "anon function @" + node.loc.start.line;
}

// Helper function for allowing parameterized formatting of strings.
if (!String.prototype.format) {
  String.prototype.format = function() {
    var args = arguments;
    return this.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined'
        ? args[number]
        : match
      ;
    });
  };
}

main();


 exports.main = main;