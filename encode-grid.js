let gridString = "0: |■ _ _ _ ■ _ _ ■ _ ■| picross.js:737:171: | _ _ ■ ■ _ _ _ ■ _ _ | picross.js: 737: 172: |■ ■ ■ ■ _ _ ■ _ _ _ | picross.js: 737: 173: |■ _ ■ _ _ _ _ _ ■ ■| picross.js: 737: 174: |■ _ _ _ _ _ ■ _ ■ _ | picross.js: 737: 175: | _ _ ■ ■ ■ _ _ ■ _ ■| picross.js: 737: 176: | _ ■ _ ■ ■ ■ _ ■ ■ ■| picross.js: 737: 177: |■ ■ ■ ■ _ ■ ■ ■ _ _ | picross.js: 737: 178: | _ _ ■ ■ ■ _ ■ _ ■ ■| picross.js: 737: 179: |■ ■ ■ _ _ _ _ ■ ■ ■|";

let outputGrid = [];

for (let i = 0; i < gridString.length; i++) {
    switch (gridString.charAt(i)) {
        case '_': outputGrid.push(0); break;
        case '■': outputGrid.push(1); break;
    }
}

console.log(outputGrid);