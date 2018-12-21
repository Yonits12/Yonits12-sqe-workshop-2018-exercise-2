import * as esprima from 'esprima';
import * as escodgen from 'escodegen';
import {variableExporter} from '../../test/helper';
import {variableExporterGlob} from '../../test/helper';
import {exportIdentifiers} from '../../test/helper';
import {consequent_exporter} from '../../test/helper';
import {ifExporter} from '../../test/helper';
import {identifierSubstituter} from '../../test/helper';
import {binaryExpSubstituter} from '../../test/helper';
import {identifierSubstituterJSON} from '../../test/helper';
import {deleteRedundantCode} from '../../test/helper';
import {ifEvaluator} from '../../test/helper';
import {parseInputs} from '../../test/helper';

var global = [];
var environment = [];
var codeString;
var env = {};
var params_glob = [];
var outputCode = '';
var lines;

function setenvironment(value) {
    environment = JSON.parse(JSON.stringify(value));
}

function setoutputCode(value) {
    outputCode = value;
}



const parseCode = (codeToParse) => {
    global = [];
    environment = [];
    params_glob = [];
    codeString = codeToParse;
    return esprima.parseScript(codeToParse, {loc: true, range: true});
};

function val_of_init_helper(parsedVarDecl, i){
    var val_of_init;
    /*if(parsedVarDecl.declarations[i].init == 'null' || parsedVarDecl.declarations[i].init == null)
        val_of_init = String(parsedVarDecl.declarations[i].init);
    else*/
    val_of_init = codeString.substring(parsedVarDecl.declarations[i].init.range[0], parsedVarDecl.declarations[i].init.range[1]);
    return val_of_init;
}


function functionExporter(parsedFuncDecl){
    const funcStruct = {
        'Line': parsedFuncDecl.loc.start.line.toString(),
        'Type': parsedFuncDecl.type,
        'Name': parsedFuncDecl.id.name,
        'Condition': '',
        'Value': ''};
    global.push(funcStruct);
    exportIdentifiers(parsedFuncDecl.params);
    for(let idx in parsedFuncDecl.body.body){
        parsedFuncDecl.body.body[idx] = exportComponents(parsedFuncDecl.body.body[idx]);
    }
    return parsedFuncDecl;
}

function returnExporter(parsedRetStat) {
    var substiutedJSON = parsedRetStat;
    substiutedJSON.argument = ensureSubtitutionJSON(parsedRetStat.argument);
    const retStruct = {
        'Line': parsedRetStat.loc.start.line.toString(),
        'Type': parsedRetStat.type,
        'Name': '',
        'Condition': '',
        'Value':  ensureSubtitution(parsedRetStat.argument),
        'json_Val': substiutedJSON.argument};
    global.push(retStruct);
    return substiutedJSON;
}


function alternate_exporter(alternate) {
    if(alternate.type == 'IfStatement')
        return ifExporter(alternate, 'ElseType');
    /*else if(alternate.type != 'BlockStatement')
        return exportComponents(alternate);*/
    else {
        for (let idx1 in alternate.body) {
            alternate.body[idx1] = exportComponents(alternate.body[idx1]);
        }
        return alternate;
    }

}

function assignmentExporter(parsedAssStat) {
    const assStruct = {
        'Line': parsedAssStat.loc.start.line.toString(),
        'Type': parsedAssStat.type,
        'Name': codeString.substring(parsedAssStat.left.range[0], parsedAssStat.left.range[1]),
        'Condition': '',
        'Value': codeString.substring(parsedAssStat.right.range[0], parsedAssStat.right.range[1])};
    global.push(assStruct);
    // pass over the global, find the Var decl of this assignment and replace the Value with the assignment.
    parsedAssStat.right = replaceValOfVar(assStruct.Name, parsedAssStat.right);
    // if there is no use of var outside current block - remove it.
    return parsedAssStat;
}

/*function assignmentExporterGlob(parsedAssStat) {
    const assStruct = {
        'Line': parsedAssStat.loc.start.line.toString(),
        'Type': parsedAssStat.type + 'Glob',
        'Name': codeString.substring(parsedAssStat.left.range[0], parsedAssStat.left.range[1]),
        'Condition': '',
        'Value': codeString.substring(parsedAssStat.right.range[0], parsedAssStat.right.range[1])};
    global.push(assStruct);
    parsedAssStat.right = replaceValOfVar(assStruct.Name, parsedAssStat.right);
    return parsedAssStat;
}*/

/*function updateExporter(parsedUpdateStat){
    const upStruct = {
        'Line': parsedUpdateStat.loc.start.line.toString(),
        'Type': parsedUpdateStat.type,
        'Name': parsedUpdateStat.argument.name,
        'Condition': '',
        'Value': codeString.substring(parsedUpdateStat.range[0], parsedUpdateStat.range[1])};
    global.push(upStruct);
    return parsedUpdateStat;
}*/
const expStatmentFuncDirector = {
    'AssignmentExpression': assignmentExporter, /*
    'UpdateExpression': updateExporter};*/
};
function expressionExporter(parsedCode){
    var exp_json = parsedCode;
    exp_json.expression = expStatmentFuncDirector[parsedCode.expression.type](parsedCode.expression);
    return exp_json;
}

function expressionExporterGlob(parsedCode){
    var exp_json = parsedCode;
    exp_json.expression = expStatmentFuncDirector[parsedCode.expression.type](parsedCode.expression);
    return exp_json;
}

/*function forExporter(parsedForCode){
    const forStruct = {
        'Line': parsedForCode.loc.start.line.toString(),
        'Type': parsedForCode.type,
        'Name': '',
        'Condition': codeString.substring(parsedForCode.test.range[0], parsedForCode.test.range[1]),
        'Value': ''};
    global.push(forStruct);
    exportComponents(parsedForCode.init);
    exportComponents(parsedForCode.update);
    consequent_exporter(parsedForCode.body);
    return parsedForCode;
}*/

function whileExporter(parsedWhileCode){
    const whileStruct = {
        'Line': parsedWhileCode.loc.start.line.toString(),
        'Type': parsedWhileCode.type,
        'Name': '',
        'Condition': ensureSubtitution(parsedWhileCode.test), //codeString.substring(parsedWhileCode.test.range[0], parsedWhileCode.test.range[1]),
        'Value': ''};
    global.push(whileStruct);
    parsedWhileCode.test = ensureSubtitutionJSON(parsedWhileCode.test);
    var env_temp = JSON.parse(JSON.stringify(environment)); //$.extend(true, [], environment);
    consequent_exporter(parsedWhileCode.body);
    environment = JSON.parse(JSON.stringify(env_temp));//$.extend(true, [], env_temp);
    return parsedWhileCode;
}



const parseFunctionDirector = {
    'VariableDeclaration': variableExporter,
    'VariableDeclarationGlob': variableExporterGlob,
    'FunctionDeclaration': functionExporter,
    'ExpressionStatement': expressionExporter,
    'ExpressionStatementGlob': expressionExporterGlob,
    'AssignmentExpression': assignmentExporter,/*
    'AssignmentExpressionGlob': assignmentExporterGlob,*//*
    'UpdateExpression': updateExporter,*/
    'WhileStatement': whileExporter,
    'IfStatement': ifExporter,
    'ReturnStatement': returnExporter/*,
    'ForStatement': forExporter*/
};

function ensureSubtitution(value_json){
    /*if(value_json == null || value_json == 'null'){
        return null;
    }
    else{
        return expSubstituteDirector[value_json.type](value_json);
    }*/
    return expSubstituteDirector[value_json.type](value_json);
}

function ensureSubtitutionJSON(value_json){
    if(value_json == null || value_json == 'null'){
        return null;
    }
    else{
        return expSubstituteDirectorJSON[value_json.type](value_json);
    }
}

function replaceValOfVar(varName, assignedVal_json){
    for(let idx in environment){
        if(environment[idx].Name == varName){
            environment[idx].Value = ensureSubtitution(assignedVal_json);
            environment[idx].json_Val = ensureSubtitutionJSON(assignedVal_json);
            return environment[idx].json_Val;
        }
    }
    return assignedVal_json;
}

/*
function identifierExporter(parsedExp) {
    return parsedExp.name;
}
function literalExporter(parsedExp) {
    return parsedExp.raw;
}
function unaryExpExporter(parsedExp) {
    return parsedExp.operator + expExportDirector[parsedExp.argument.type](parsedExp.argument);
}
function binaryExpExporter(parsedExp) {
    return expExportDirector[parsedExp.left.type](parsedExp.left) + parsedExp.operator + expExportDirector[parsedExp.right.type](parsedExp.right);
}
*/


function literalSubstituter(parsedExp) {
    return parsedExp.raw;
}
function unaryExpSubstituter(parsedExp) {
    return parsedExp.operator + expSubstituteDirector[parsedExp.argument.type](parsedExp.argument);
}
function memberExpSubstituter(parsedExp) {
    var arrNameAfterSub = expSubstituteDirector[parsedExp.object.type](parsedExp.object);
    var propertyAfterSub = expSubstituteDirector[parsedExp.property.type](parsedExp.property);
    return arrNameAfterSub + '[' + propertyAfterSub + ']';
}


function literalSubstituterJSON(parsedExp) {
    return parsedExp;
}
function unaryExpSubstituterJSON(parsedExp) {
    var clone = parsedExp;
    clone.argument = expSubstituteDirectorJSON[parsedExp.argument.type](parsedExp.argument);
    return clone;
}
function binaryExpSubstituterJSON(parsedExp) {
    var clone = parsedExp;
    clone.left = expSubstituteDirectorJSON[parsedExp.left.type](parsedExp.left);
    clone.right = expSubstituteDirectorJSON[parsedExp.right.type](parsedExp.right);
    return clone;
}

function memberExpSubstituterJSON(parsedExp) {
    var clone = parsedExp;
    clone.object = expSubstituteDirectorJSON[parsedExp.object.type](parsedExp.object);
    clone.property = expSubstituteDirectorJSON[parsedExp.property.type](parsedExp.property);
    return clone;
}



/*
const expExportDirector = {
    'Identifier': identifierExporter,
    'Literal': literalExporter,
    'UnaryExpression': unaryExpExporter,
    'BinaryExpression': binaryExpExporter
};
*/

const expSubstituteDirector = {
    'Identifier': identifierSubstituter,
    'Literal': literalSubstituter,
    'UnaryExpression': unaryExpSubstituter,
    'BinaryExpression': binaryExpSubstituter,
    'MemberExpression': memberExpSubstituter
};

const expSubstituteDirectorJSON = {
    'Identifier': identifierSubstituterJSON,
    'Literal': literalSubstituterJSON,
    'UnaryExpression': unaryExpSubstituterJSON,
    'BinaryExpression': binaryExpSubstituterJSON,
    'MemberExpression': memberExpSubstituterJSON
};


function exportComponents(parsedCode){
    if(parsedCode.type == 'Program') {
        for(let idx1 in parsedCode.body){
            parsedCode.body[idx1] = exportGlobals(parsedCode.body[idx1]);
        }
        for(let idx1 in parsedCode.body){
            parsedCode.body[idx1] = exportInsideFunc(parsedCode.body[idx1]);
        }
    }
    else{
        return parseFunctionDirector[parsedCode.type](parsedCode);
    }
    if(parsedCode.type == 'Program'){
        outputCode = escodgen.generate(parsedCode);  //JSON.stringify(parsedCode, null, 2);
        return;
    }
}




function exportGlobals(parsedCode){
    if(parsedCode.type == 'VariableDeclaration' || parsedCode.type == 'ExpressionStatement') {
        return parseFunctionDirector[parsedCode.type + 'Glob'](parsedCode);
    }
    return parsedCode;
}
function exportInsideFunc(parsedCode){
    if(parsedCode.type == 'FunctionDeclaration') {
        return parseFunctionDirector[parsedCode.type](parsedCode);
    }
    return parsedCode;
}


// ****************************************************************************************************************
// ****************************************************************************************************************
function prepareEvaluate(){
    var env_temp = JSON.parse(JSON.stringify(environment));//$.extend(true, [], environment);
    var parsedCodeJSON = parseCode(outputCode);
    environment = JSON.parse(JSON.stringify(env_temp));//$.extend(true, [], env_temp);
    parsedCodeJSON = deleteRedundantCode(parsedCodeJSON);
    outputCode = escodgen.generate(parsedCodeJSON);
    parsedCodeJSON = parseCode(outputCode);

    environment = JSON.parse(JSON.stringify(env_temp));//$.extend(true, [], env_temp);
    env = {};
    for(let idx in environment){
        if(environment[idx].Type == 'Identifier'){
            env[environment[idx].Name] = eval(environment[idx].Value);//Parser.evaluate(environment[idx].Value, env);
        }
    }
    return parsedCodeJSON;
}


function evaluateComponents(parsedCode){
    lines = outputCode.split('\n');

    if(parsedCode.type == 'Program') {
        for (let idx1 in parsedCode.body) {
            evaluateFunctionDirector[parsedCode.body[idx1].type](parsedCode.body[idx1]);
        }
    }
    outputCode = '';
    for(var j=0; j<lines.length; j++){
        outputCode = outputCode + lines[j] + '\n';
    }
    return outputCode;
}

/*function variableEvaluator(varJson){
    return varJson;
}*/


function functionEvaluator(funcJson){
    for (let idx1 in funcJson.body.body) {
        evaluateFunctionDirector[funcJson.body.body[idx1].type](funcJson.body.body[idx1]);
    }
}

function expressionEvaluator(expJson){
    evaluateFunctionDirector[expJson.expression.type](expJson.expression);
}


function assignmentEvaluator(assJson){
    // eval the right side
    var rightSide;
    if(assJson.right.type == 'MemberExpression'){
        rightSide = String(env[assJson.right.object.name][assJson.right.property.value]);
    }
    else{
        rightSide = escodgen.generate(assJson.right);
    }
    var leftSide = assJson.left.name;
    var Parser = require('expr-eval').Parser;
    // save into left side in the env
    env[leftSide] = Parser.evaluate(rightSide, env);
}

/*function updateEvaluator(updJson){
    // eval the right side
    var rightSide = updJson.argument.name + updJson.operator.substring(0,1) + '1';
    var leftSide = updJson.argument.name;
    var Parser = require('expr-eval').Parser;
    // save into left side in the env
    env[leftSide] = Parser.evaluate(rightSide, env);
}*/

function whileEvaluator(whileJson){
    return whileJson;
}

function checkAndReplaceMem(cond_json){
    if(cond_json.type == 'MemberExpression'){
        var val = String(env[cond_json.object.name][cond_json.property.value]);
        return esprima.parseScript(val, {loc: true, range: true}).body[0].expression;
    }
    else if(cond_json.type == 'BinaryExpression'){
        cond_json.left = checkAndReplaceMem(cond_json.left);
        cond_json.right = checkAndReplaceMem(cond_json.right);
        return cond_json;
    }
    else{
        return cond_json;
    }
}


function returnEvaluator(retJson){
    return retJson;
}


const evaluateFunctionDirector = {/*
    'VariableDeclaration': variableEvaluator,*/
    'FunctionDeclaration': functionEvaluator,
    'ExpressionStatement': expressionEvaluator,
    'AssignmentExpression': assignmentEvaluator,/*
    'UpdateExpression': updateEvaluator,*/
    'WhileStatement': whileEvaluator,
    'IfStatement': ifEvaluator,
    'ReturnStatement': returnEvaluator
};


// ****************************************************************************************************************
// ****************************************************************************************************************


export {parseCode};
export {exportComponents};
export {global};
export {environment};
export {outputCode};
export {parseInputs};
export {prepareEvaluate};
export {evaluateComponents};

export {codeString};
export {env};
export {params_glob};
export {lines};

export {val_of_init_helper};
export {functionExporter} ;
export {returnExporter} ;
export {alternate_exporter} ;
export {assignmentExporter} ;/*
export {assignmentExporterGlob} ;*//*
export {updateExporter} ;*/
export {expStatmentFuncDirector} ;

export {expressionExporter} ;
export {expressionExporterGlob} ;
/*export {forExporter} ;*/
export {whileExporter} ;
export {parseFunctionDirector} ;
export {ensureSubtitution} ;
export {ensureSubtitutionJSON} ;
export {replaceValOfVar} ;

/*export {identifierExporter} ;
export {literalExporter} ;
export {unaryExpExporter} ;
export {binaryExpExporter} ;*/
export {literalSubstituter} ;
export {unaryExpSubstituter} ;
export {memberExpSubstituter} ;
export {literalSubstituterJSON} ;

export {unaryExpSubstituterJSON} ;
export {binaryExpSubstituterJSON} ;
export {memberExpSubstituterJSON} ;/*
export {expExportDirector} ;*/
export {expSubstituteDirector} ;
export {expSubstituteDirectorJSON} ;
export {exportGlobals} ;

export {exportInsideFunc};/*
export {variableEvaluator};*/
export {functionEvaluator};
export {expressionEvaluator};
export {assignmentEvaluator};/*
export {updateEvaluator}; the prob: no global var in env{}, taking just params  */

export {whileEvaluator};
export {checkAndReplaceMem};
export {returnEvaluator};
export {evaluateFunctionDirector};

export {setenvironment};
export {setoutputCode};