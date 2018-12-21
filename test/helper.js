import * as esprima from 'esprima';
import * as escodgen from 'escodegen';
import {exportComponents} from '../src/js/code-analyzer';
import {global} from '../src/js/code-analyzer';
import {environment} from '../src/js/code-analyzer';
import {env} from '../src/js/code-analyzer';
import {params_glob} from '../src/js/code-analyzer';
import {lines} from '../src/js/code-analyzer';
import {val_of_init_helper} from '../src/js/code-analyzer';
import {alternate_exporter} from '../src/js/code-analyzer';
import {ensureSubtitution} from '../src/js/code-analyzer';
import {ensureSubtitutionJSON} from '../src/js/code-analyzer';
import {expSubstituteDirector} from '../src/js/code-analyzer';
import {checkAndReplaceMem} from '../src/js/code-analyzer';
import {evaluateFunctionDirector} from '../src/js/code-analyzer';

import {setenvironment}from '../src/js/code-analyzer';
import {setoutputCode}from '../src/js/code-analyzer';


function variableExporter(parsedVarDecl){
    var substiutedJSON = parsedVarDecl;
    for(var i=0; i<parsedVarDecl.declarations.length; i++){
        var curr_decl = parsedVarDecl.declarations[i];
        curr_decl.init = ensureSubtitutionJSON(parsedVarDecl.declarations[i].init);
        if(curr_decl.init == null){
            curr_decl.init = curr_decl.id;
        }
        const varStruct = {
            'Line': parsedVarDecl.loc.start.line.toString(),
            'Type': parsedVarDecl.type,
            'Name': parsedVarDecl.declarations[i].id.name,
            'Condition': '',
            'Value': val_of_init_helper(parsedVarDecl, i)};
        const varStructEnv = {
            'Line': parsedVarDecl.loc.start.line.toString(),
            'Type': parsedVarDecl.type,
            'Name': parsedVarDecl.declarations[i].id.name,
            'Condition': '',
            'Value': ensureSubtitution(parsedVarDecl.declarations[i].init),
            'json_Val': curr_decl.init};
        global.push(varStruct);
        environment.push(varStructEnv);
        substiutedJSON.declarations[i] = curr_decl;
    }
    return substiutedJSON;
}

function variableExporterGlob(parsedVarDecl){
    var substiutedJSON = parsedVarDecl;
    for(var i=0; i<parsedVarDecl.declarations.length; i++){
        var curr_decl = parsedVarDecl.declarations[i];
        curr_decl.init = ensureSubtitutionJSON(parsedVarDecl.declarations[i].init);
        if(curr_decl.init == null){
            curr_decl.init = curr_decl.id;
        }
        const varStruct = {
            'Line': parsedVarDecl.loc.start.line.toString(),
            'Type': parsedVarDecl.type + 'Glob',
            'Name': parsedVarDecl.declarations[i].id.name,
            'Condition': '',
            'Value': val_of_init_helper(parsedVarDecl, i)};
        const varStructEnv = {
            'Line': parsedVarDecl.loc.start.line.toString(),
            'Type': parsedVarDecl.type + 'Glob',
            'Name': parsedVarDecl.declarations[i].id.name,
            'Condition': '',
            'Value': ensureSubtitution(parsedVarDecl.declarations[i].init),
            'json_Val': curr_decl.init};
        global.push(varStruct);
        environment.push(varStructEnv);
        substiutedJSON.declarations[i] = curr_decl;
    }
    return substiutedJSON;
}

function exportIdentifiers(params) {
    for(var i=0; i<params.length; i++) {
        const varStruct = {
            'Line': params[i].loc.start.line.toString(),
            'Type': params[i].type,
            'Name': params[i].name,
            'Condition': '',
            'Value': ''
        };
        const varStructEnv = {
            'Line': params[i].loc.start.line.toString(),
            'Type': params[i].type,
            'Name': params[i].name,
            'Condition': '',
            'Value': params[i].name,
            'json_Val': params[i]
        };
        params_glob.push(params[i].name);
        global.push(varStruct);
        environment.push(varStructEnv);
    }
}

function consequent_exporter(consequent) {
    if(consequent.type != 'BlockStatement'){
        return exportComponents(consequent);
    }
    else{
        for(let idx1 in consequent.body){
            consequent.body[idx1] = exportComponents(consequent.body[idx1]);
        }
        for(let idx in consequent.body) {
            for(let idx_1 in environment) {
                if(consequent.body[idx].type == 'ExpressionStatement' && consequent.body[idx].expression.type == 'AssignmentExpression'){
                    if(environment[idx_1].Name == consequent.body[idx].expression.left.name){
                        environment[idx_1].Condition = 'volatile';
                    }
                }
            }
        }
    }
    return consequent;
}

function ifExporter(parsedIfStat, ...elseType) {
    var type = parsedIfStat.type;
    if(elseType.length>0 && elseType[0]=='ElseType') type='ElseIfStatment';
    const ifStruct = {
        'Line': parsedIfStat.loc.start.line.toString(),
        'Type': type,
        'Name': '',
        'Condition': ensureSubtitution(parsedIfStat.test),
        'Value': ''};
    global.push(ifStruct);
    var env_temp = JSON.parse(JSON.stringify(environment));//$.extend(true, [], environment);//Array.from(environment);
    parsedIfStat.test = ensureSubtitutionJSON(parsedIfStat.test);
    parsedIfStat.consequent = consequent_exporter(parsedIfStat.consequent);
    var volatiles = [];
    if(parsedIfStat.alternate != null) {
        setenvironment(JSON.parse(JSON.stringify(env_temp)));//$.extend(true, [], env_temp));
        parsedIfStat.alternate = alternate_exporter(parsedIfStat.alternate);
    }
    for(let idx in environment){
        if(environment[idx].Condition == 'volatile'){
            volatiles.push(environment[idx].Name);
        }
    }
    setenvironment(JSON.parse(JSON.stringify(env_temp)));//$.extend(true, [], env_temp));
    for(let idx in volatiles){
        for(let idx_2 in environment){
            if(environment[idx_2].Name == volatiles[idx]){
                environment[idx_2].Condition = 'volatile';
            }
        }
    }
    return parsedIfStat;
}

function identifierSubstituter(parsedExp) {
    for(let idx in environment){
        if(environment[idx].Name == parsedExp.name && environment[idx].Value != 'null' && environment[idx].Value != null  && environment[idx].Condition != 'volatile'){
            if(environment[idx].json_Val.type == 'BinaryExpression' && (environment[idx].json_Val.operator == '+' || environment[idx].json_Val.operator == '-')){
                return '(' + environment[idx].Value + ')';
            }
            return environment[idx].Value;
        }
    }
    return parsedExp.name;
}
function binaryExpSubstituter(parsedExp) {
    var leftAfterSub = expSubstituteDirector[parsedExp.left.type](parsedExp.left);
    var rightAfterSub = expSubstituteDirector[parsedExp.right.type](parsedExp.right);
    if(parsedExp.operator == '*' || parsedExp.operator == '/'){
        if(parsedExp.left.type == 'BinaryExpression' && (parsedExp.left.operator == '+' || parsedExp.left.operator == '-')){
            leftAfterSub = '(' + leftAfterSub + ')';
        }
        if(parsedExp.right.type == 'BinaryExpression' && (parsedExp.right.operator == '+' || parsedExp.right.operator == '-')) {
            rightAfterSub = '(' + rightAfterSub + ')';
        }
    }
    return leftAfterSub + parsedExp.operator + rightAfterSub;
}

function identifierSubstituterJSON(parsedExp) {
    for(let idx in environment){
        if(environment[idx].Name == parsedExp.name && environment[idx].Value != 'null' && environment[idx].Value != null && environment[idx].Condition != 'volatile'){
            return environment[idx].json_Val;
        }
    }
    return parsedExp;
}

function deleteRedundantCode(parsedCodeJSON){
    if(parsedCodeJSON.type == 'Program'){
        for(let idx=0; idx < parsedCodeJSON.body.length; idx++){
            if(parsedCodeJSON.body[idx].type == 'VariableDeclaration'){
                parsedCodeJSON.body.splice(idx, 1);
                idx--;
            }
            else if(parsedCodeJSON.body[idx].type == 'FunctionDeclaration'){
                parsedCodeJSON.body[idx] = deleteRedundantCode(parsedCodeJSON.body[idx]);
            }
        }
        setoutputCode(escodgen.generate(parsedCodeJSON));
    }
    else if(parsedCodeJSON.type == 'FunctionDeclaration'){
        for(let idx=0; idx < parsedCodeJSON.body.body.length; idx++){
            if(parsedCodeJSON.body.body[idx].type == 'VariableDeclaration'){
                parsedCodeJSON.body.body.splice(idx, 1)
                idx--;
            }
            else{
                parsedCodeJSON.body.body[idx] = deleteRedundantCode(parsedCodeJSON.body.body[idx]);
            }
        }
    }
    else if(parsedCodeJSON.type == 'IfStatement'){
        for(let idx=0; idx < parsedCodeJSON.consequent.body.length; idx++){
            if(parsedCodeJSON.consequent.body[idx].type == 'VariableDeclaration'){
                parsedCodeJSON.consequent.body.splice(idx, 1)
                idx--;
            }
            else if(parsedCodeJSON.consequent.body[idx].type == 'ExpressionStatement' && parsedCodeJSON.consequent.body[idx].expression.type == 'AssignmentExpression'){
                var flag = true;
                for(let idx_1 in environment){
                    if(parsedCodeJSON.consequent.body[idx].expression.left.name == environment[idx_1].Name){
                        if(environment[idx_1].Type == 'Identifier'){
                            flag = false;
                        }
                    }
                }
                if(flag){
                    parsedCodeJSON.consequent.body.splice(idx, 1)
                    idx--;
                }
            }
            else{
                parsedCodeJSON.consequent.body[idx] = deleteRedundantCode(parsedCodeJSON.consequent.body[idx]);
            }
        }
        if(parsedCodeJSON.alternate.type == 'BlockStatement'){
            for(let idx=0; idx < parsedCodeJSON.alternate.body.length; idx++){
                if(parsedCodeJSON.alternate.body[idx].type == 'VariableDeclaration'){
                    parsedCodeJSON.alternate.body.splice(idx, 1)
                    idx--;
                }
                else if(parsedCodeJSON.alternate.body[idx].type == 'ExpressionStatement' && parsedCodeJSON.alternate.body[idx].expression.type == 'AssignmentExpression'){
                    var flag_2 = true;
                    for(let idx_1 in environment){
                        if(parsedCodeJSON.alternate.body[idx].expression.left.name == environment[idx_1].Name){
                            if(environment[idx_1].Type == 'Identifier'){
                                flag = false;
                            }
                        }
                    }
                    if(flag_2){
                        parsedCodeJSON.alternate.body.splice(idx, 1)
                        idx--;
                    }
                }
                else{
                    parsedCodeJSON.alternate.body[idx] = deleteRedundantCode(parsedCodeJSON.consequent.body[idx]);
                }
            }
        }
        parsedCodeJSON.alternate = deleteRedundantCode(parsedCodeJSON.alternate);
    }
    return parsedCodeJSON;

}


function ifEvaluator(ifJson){
    var Parser = require('expr-eval').Parser;
    var if_line = ifJson.loc.start.line;
    var test_str;
    for(let elem in global){
        if(global[elem].Line == String(if_line)){
            test_str = global[elem].Condition;
        }
    }
    var test_json = esprima.parseScript(test_str, {loc: true, range: true}).body[0].expression;
    test_json = checkAndReplaceMem(test_json);
    var test_val = Parser.evaluate(escodgen.generate(test_json), env);


    if (test_val) {
        lines[if_line-1] = '<mark style="background-color:green;">' + lines[if_line-1] + '</mark>';
        for (let idx1 in ifJson.consequent.body) {
            evaluateFunctionDirector[ifJson.consequent.body[idx1].type](ifJson.consequent.body[idx1]);
        }
        var curr_alternate = ifJson.alternate;
        while(curr_alternate != null){
            var alternate_line = curr_alternate.loc.start.line;
            lines[alternate_line-1] = '<mark style="background-color:red;">' + lines[alternate_line-1] + '</mark>';
            if(curr_alternate.type != 'BlockStatement'){
                curr_alternate = curr_alternate.alternate;
            }
            else{
                curr_alternate = null;
            }
        }
    }
    else{
        lines[if_line-1] = '<mark style="background-color:red;">' + lines[if_line-1] + '</mark>';
        if(ifJson.alternate.type == 'BlockStatement'){
            var else_line = ifJson.alternate.loc.start.line;
            lines[else_line-1] = '<mark style="background-color:green;">' + lines[else_line-1] + '</mark>';
            for (let idx1 in ifJson.alternate.body) {
                evaluateFunctionDirector[ifJson.alternate.body[idx1].type](ifJson.alternate.body[idx1]);
            }
        }
        else{
            evaluateFunctionDirector[ifJson.alternate.type](ifJson.alternate);
        }
    }
}

function parseInputs(inputStr) {
    var partsOfInputStr = inputStr.split(',');
    var accIn = '';
    for (var i=0; i<partsOfInputStr.length; i++){
        var currIn = partsOfInputStr[i];
        if(currIn.startsWith('[')){
            accIn = accIn + currIn;
            while(!accIn.endsWith(']')){
                accIn = accIn + ',' + partsOfInputStr[i+1];
                partsOfInputStr.splice(i,1);
            }
            currIn = partsOfInputStr[i] = accIn;
        }
        var currName = params_glob[i];
        for(let idx in environment){
            if(environment[idx].Name == currName && environment[idx].Type == 'Identifier'){
                environment[idx].Value = currIn;
            }
        }
    }
}



// ****************************************************************************************************************
// ****************************************************************************************************************


export {parseInputs};
export {variableExporter};
export {variableExporterGlob};
export {exportIdentifiers};
export {consequent_exporter};
export {ifExporter};
export {identifierSubstituter};
export {binaryExpSubstituter};
export {identifierSubstituterJSON};
export {deleteRedundantCode};
export {ifEvaluator};