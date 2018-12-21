import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {exportComponents} from './code-analyzer';
import {outputCode} from './code-analyzer';
import {parseInputs} from './code-analyzer';
import {prepareEvaluate} from './code-analyzer';
import {evaluateComponents} from './code-analyzer';


$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val();
        let inputArgs = $('#inputPlaceholder').val();
        let parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        //var json_obj = JSON.parse(parsedCode);
        exportComponents(parsedCode);
        parseInputs(inputArgs);
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        $('pre').html(evaluateComponents(parsedCodeJSON));

    });
});

/*function cloneEl(el) {
    var clo = el.cloneNode(true);
    return clo;
}

function cleanUpRow(obj) {
    var ch_nodes = obj.childNodes;
    for (var i = 0; ch_nodes[i]; ++i) {
        if (ch_nodes[i].tagName == 'TH') {
            ch_nodes[i].textContent = '';
        }
    }
}*/

/*function addRow(row_idx) {
    var root = document.getElementById('parseTable').getElementsByTagName('thead')[0];
    var rows = root.getElementsByTagName('tr');
    var clone = cloneEl(rows[rows.length - 1]);
    cleanUpRow(clone);
    fillUpRow(clone, row_idx);
    var root_to_put = document.getElementById('parseTable').getElementsByTagName('tbody')[rows.length - 1];
    root_to_put.appendChild(clone);
}*/

/*
function addRow1(row_idx) {
    var root = document.getElementById('envTable').getElementsByTagName('thead')[0];
    var rows = root.getElementsByTagName('tr');
    var clone = cloneEl(rows[rows.length - 1]);
    cleanUpRow(clone);
    fillUpRow1(clone, row_idx);
    var root_to_put = document.getElementById('envTable').getElementsByTagName('tbody')[rows.length - 1];
    root_to_put.appendChild(clone);
}
*/

/*function fillTableHTML(){
    var root = document.getElementById('parseTable').getElementsByTagName('tbody')[0];
    var rows = root.getElementsByTagName('tr');
    var len_rows = rows.length;
    for(var j=0; j<len_rows; j++){
        document.getElementById('parseTable').deleteRow(1);
    }
    for(var i=0; i<global.length; i++) {
        addRow(i);
    }
}*/

/*function fillTableHTML2(){
    var root = document.getElementById('envTable').getElementsByTagName('tbody')[0];
    var rows = root.getElementsByTagName('tr');
    var len_rows = rows.length;
    for(var j=0; j<len_rows; j++){
        var envtableVar = document.getElementById('envTable')
        envtableVar.deleteRow(1);
    }
    for(var i=0; i<environment.length; i++) {
        addRow1(i);
    }
}*/

/*function fillUpRow(clone, row_idx){
    var ch_nodes = clone.childNodes;
    for (var i = 0; ch_nodes[i]; ++i) {
        if (ch_nodes[i].tagName == 'TH') {
            fill_Line(ch_nodes[i], row_idx);
        }
    }
}


function fillUpRow1(clone, row_idx){
    var ch_nodes = clone.childNodes;
    for (var i = 0; ch_nodes[i]; ++i) {
        if (ch_nodes[i].tagName == 'TH') {
            fill_Line1(ch_nodes[i], row_idx);
        }
    }
}*/

/*
function fill_Line(ch_node, row_idx) {
    if (ch_node.id == 'Line') ch_node.textContent = global[row_idx].Line;
    else fill_Type(ch_node, row_idx);
}
function fill_Type(ch_node, row_idx){
    if (ch_node.id == 'Type') ch_node.textContent = global[row_idx].Type;
    else fill_Name(ch_node, row_idx);
}
function fill_Name(ch_node, row_idx){
    if (ch_node.id == 'Name') ch_node.textContent = global[row_idx].Name;
    else fill_Condition(ch_node, row_idx);
}
function fill_Condition(ch_node, row_idx){
    if (ch_node.id == 'Condition') ch_node.textContent = global[row_idx].Condition;
    else fill_Value(ch_node, row_idx);
}
function fill_Value(ch_node, row_idx){
    ch_node.textContent = global[row_idx].Value;
}


function fill_Line1(ch_node, row_idx) {
    if (ch_node.id == 'Line1') ch_node.textContent = environment[row_idx].Line;
    else fill_Type1(ch_node, row_idx);
}
function fill_Type1(ch_node, row_idx){
    if (ch_node.id == 'Type1') ch_node.textContent = environment[row_idx].Type;
    else fill_Name1(ch_node, row_idx);
}
function fill_Name1(ch_node, row_idx){
    if (ch_node.id == 'Name1') ch_node.textContent = environment[row_idx].Name;
    else fill_Condition1(ch_node, row_idx);
}
function fill_Condition1(ch_node, row_idx){
    if (ch_node.id == 'Condition1') ch_node.textContent = environment[row_idx].Condition;
    else fill_Value1(ch_node, row_idx);
}
function fill_Value1(ch_node, row_idx){
    ch_node.textContent = environment[row_idx].Value;
}*/
