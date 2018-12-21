import assert from 'assert';
import {
    exportComponents,
    parseCode,
    parseInputs,
    prepareEvaluate,
    evaluateComponents,
    global,
    outputCode
} from '../src/js/code-analyzer';


describe('The javascript parser', () => {
    it('is parsing an empty program correctly', () => {
        assert.equal(JSON.stringify(parseCode('')),
            '{"type":"Program","body":[],"sourceType":"script","range":[0,0]' +
            ',"loc":{"start":{"line":0,"column":0},"end":{"line":0,"column":0}}}'
        );
    });
    it('is parsing a simple variable declaration correctly', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 1;')),
            '{"type":"Program","body":[{"type":"VariableDeclaration",' +
            '"declarations":[{"type":"VariableDeclarator","id":{"type":' +
            '"Identifier","name":"a","range":[4,5],"loc":{"start":{"line"' +
            ':1,"column":4},"end":{"line":1,"column":5}}},"init":{"type":' +
            '"Literal","value":1,"raw":"1","range":[8,9],"loc":{"start":' +
            '{"line":1,"column":8},"end":{"line":1,"column":9}}},"range":' +
            '[4,9],"loc":{"start":{"line":1,"column":4},"end":{"line":1,' +
            '"column":9}}}],"kind":"let","range":[0,10],"loc":{"start":' +
            '{"line":1,"column":0},"end":{"line":1,"column":10}}}],' +
            '"sourceType":"script","range":[0,10],"loc":{"start":{"line"' +
            ':1,"column":0},"end":{"line":1,"column":10}}}'
        );
    });

    it('is parsing an empty function with return statement correctly', () => {
        assert.equal(JSON.stringify(parseCode('function foo(){ return 1; }')),
            '{"type":"Program","body":[{"type":"FunctionDeclaration","id":{"type":' +
            '"Identifier","name":"foo","range":[9,12],"loc":{"start":{"line":1,' +
            '"column":9},"end":{"line":1,"column":12}}},"params":[],"body":{"type":' +
            '"BlockStatement","body":[{"type":"ReturnStatement","argument":{"type":' +
            '"Literal","value":1,"raw":"1","range":[23,24],"loc":{"start":{"line":' +
            '1,"column":23},"end":{"line":1,"column":24}}},"range":[16,25],"loc":' +
            '{"start":{"line":1,"column":16},"end":{"line":1,"column":25}}}],"range":' +
            '[14,27],"loc":{"start":{"line":1,"column":14},"end":{"line":1,"column":27}}}' +
            ',"generator":false,"expression":false,"async":false,"range":[0,27],"loc":' +
            '{"start":{"line":1,"column":0},"end":{"line":1,"column":27}}}],"sourceType":' +
            '"script","range":[0,27],"loc":{"start":{"line":1,"column":0},"end":{"line":1,"column":27}}}'
        );
    });
    it('is preparing data structure of a simple variable declaration correctly', () => {
        exportComponents(parseCode('let a = 1;'));
        assert.deepEqual(
            global,
            [{Line: '1', Type: 'VariableDeclarationGlob', Name: 'a', Condition: '', Value: '1'}]
        );
    });
    it('is preparing data structure of 3 initialized variable declarations correctly', () => {
        exportComponents(parseCode('let w, x=10, y=20, z=30;'));
        assert.deepEqual(
            global,
            [   {Line: '1', Type: 'VariableDeclarationGlob', Name: 'w', Condition: '', Value: 'w'},
                {Line: '1', Type: 'VariableDeclarationGlob', Name: 'x', Condition: '', Value: '10'},
                {Line: '1', Type: 'VariableDeclarationGlob', Name: 'y', Condition: '', Value: '20'},
                {Line: '1', Type: 'VariableDeclarationGlob', Name: 'z', Condition: '', Value: '30'}  ]
        );
    });
    it('simple funtion sunstitution with local var', () => {
        exportComponents(parseCode('function foo(x){}'));
        parseInputs('1');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'function foo(x) {\n' +
            '}\n'
        );
    });
    it('simple funtion sunstitution with global var', () => {
        exportComponents(parseCode('let a = 1;\nfunction foo(x){return x;}'));
        parseInputs('1');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'function foo(x) {\n    return x;\n}\n'
        );
    });
    it('simple funtion sunstitution with global ass', () => {
        exportComponents(parseCode('let c = 1;\n' +
            'c = 2;\n' +
            'function foo(x, y, z, arr){\n' +
            '    return 6;\n' +
            '}\n'));
        parseInputs('1,2,3,[1,2,3]');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'c = 2;\nfunction foo(x, y, z, arr) {\n    return 6;\n}\n'
        );
    });
    it('simple funtion sunstitution with arr right side', () => {
        exportComponents(parseCode('let c = 1;\n' +
            'function foo(x, y, z, arr){\n' +
            '    x = arr[0];\n' +
            '}\n'));
        parseInputs('1,2,3,[1,2,3]');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'function foo(x, y, z, arr) {\n    x = arr[0];\n}\n'
        );
    });
    it('function with while with UNARY', () => {
        exportComponents(parseCode('let c = -1;\n' +
            'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    \n' +
            '    while (c < 10) {\n' +
            '        a = x * y;\n' +
            '        z = a * b * c;\n' +
            '    }\n' +
            '}\n'));
        parseInputs('1,2,3');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'function foo(x, y, z) {\n    while (-1 < 10) {\n        a = x * y;\n        z = x * y * (x + 1 + y) * -1;\n    }\n}\n'
        );
    });
    it('complex function with while with if-else', () => {
        exportComponents(parseCode('let c = 1;\n' +
            'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    \n' +
            '    while (c < 10) {\n' +
            '        a = x * y;\n' +
            '        z = a * b * c;\n' +
            '    }\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        z = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '}\n'));
        parseInputs('1,2,3');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'function foo(x, y, z) {\n    while (1 < 10) {\n        a = x * y;\n        z = x * y * (x + 1 + y) * 1;\n    }\n<mark style="background-color:red;">    if (x + 1 + y < z) {</mark>\n        z = 1 + 5;\n        return x + y + (1 + 5) + 1;\n<mark style="background-color:green;">    } else if (x + 1 + y < z * 2) {</mark>\n        return x + y + z + (1 + x + 5);\n<mark style="background-color:red;">    } else {</mark>\n        return x + y + z + (1 + x + 5);\n    }\n}\n'
        );
    });
    it('complex function with while with if-else with arr', () => {
        exportComponents(parseCode('let c = 1;\n' +
            'function foo(x, y, z, arr){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    \n' +
            '    while (c < 10) {\n' +
            '        a = x * y;\n' +
            '        z = a * b * c;\n' +
            '    }\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        z = c + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else if (arr[0] < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '        return x + y + z + c;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '        return x + y + z + c;\n' +
            '    }\n' +
            '}'));
        parseInputs('1,2,3,[4,3,2]');
        var parsedCodeJSON = prepareEvaluate();
        let parsedCode_2 = parseCode(outputCode);
        exportComponents(parsedCode_2);

        assert.deepEqual(
            evaluateComponents(parsedCodeJSON),
            'function foo(x, y, z, arr) {\n    while (1 < 10) {\n        a = x * y;\n        z = x * y * (x + 1 + y) * 1;\n    }\n<mark style="background-color:red;">    if (x + 1 + y < z) {</mark>\n        z = 1 + 5;\n        return x + y + (1 + 5) + 1;\n<mark style="background-color:green;">    } else if (arr[0] < z * 2) {</mark>\n        return x + y + z + (1 + x + 5);\n<mark style="background-color:red;">    } else {</mark>\n        return x + y + z + (1 + x + 5);\n    }\n}\n'
        );
    });
});