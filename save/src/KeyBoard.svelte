<script>
  import { createEventDispatcher } from "svelte/internal";
  let btnChar = "";
  export let keyboardArray = [];
  export let answer;
  export let KeyCode;
  let btnIndex = 0;
  let keyBind;
  const rowFir = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
  const rowSec = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
  const rowThr = ["z", "x", "c", "v", "b", "n", "m"];
  const dispatch = createEventDispatcher();
  function overlap(array, word) {
    let newAnswer = array.split("");
    let retrunArray;
    newAnswer.splice(newAnswer.indexOf(word), 1, "#");
    retrunArray = [...newAnswer].join("");
    return retrunArray;
  }
  function arraySort(targetArray) {
    let newArray = [[], [], []]; //0 순서철자일치, 1철자일치, 2불일치 정렬
    let newAnswer = [...answer].join("");
    targetArray.split("").forEach((word, i) => {
      if (!newAnswer.includes(word)) {
        newArray[2] = [...newArray[2], word];
      }
    });
    targetArray.split("").forEach((word, i) => {
      if (newAnswer.includes(word) && word === newAnswer[i] && word) {
        newAnswer = overlap(newAnswer, word);
        newArray[0] = [...newArray[0], word];
      }
    });
    targetArray.split("").forEach((word, i) => {
      if (newAnswer.includes(word) && word !== newAnswer[i]) {
        newAnswer = overlap(newAnswer, word);
        newArray[1] = [...newArray[1], word];
      }
    });
    return newArray;
  }
  function keyStyle(array) {
    const newArray = [...array];
    const keyBtns = document.querySelectorAll(".btn");
    if (newArray[0].length !== 0) {
      newArray[0].forEach((word, i) => {
        keyBtnForEach(keyBtns, "#6aaa64", word);
      });
    }
    if (newArray[1].length !== 0) {
      newArray[1].forEach((word, i) => {
        keyBtnForEach(keyBtns, "#c9b458", word);
      });
    }
    if (newArray[2].length !== 0) {
      newArray[2].forEach((word) => {
        keyBtnForEach(keyBtns, "#787c7e", word);
      });
    }
  }
  function keyBtnForEach(elementList, backColor, word) {
    elementList.forEach((btElement) => {
      if (btElement.getAttribute("char") === word) {
        if (btElement.style.backgroundColor !== "rgb(106, 170, 100)") {
          btElement.style.backgroundColor = `${backColor}`;
          btElement.style.color = "#ffffff";
        }
      }
    });
  }
  $: keyboardArray.length === 0
    ? undefined
    : keyStyle(arraySort(keyboardArray[keyboardArray.length - 1]));
  function btnClick(e) {
    if (KeyCode === 13) {
    } else if (e.target.hasAttribute("char")) {
      btnChar = e.target.getAttribute("char");
      dispatch("btnCharArray", {
        word: btnChar,
      });
    }
  }
</script>

<div class="keyBoard" on:click={btnClick}>
  <div class="keyBoardWrap" bind:this={keyBind}>
    <div class="row">
      {#each rowFir as char}
        <button class="keyBoardCharacter btn" {char} btnstate="notUsed"
          >{char}</button
        >
      {/each}
    </div>
    <div class="row row2">
      <div class="space" />
      {#each rowSec as char}
        <button class="keyBoardCharacter btn" {char} btnstate="notUsed"
          >{char}</button
        >
      {/each}
      <div class="space" />
    </div>
    <div class="row">
      <button class="keyBoardCharacter enter" char="Enter">Enter</button>
      {#each rowThr as char}
        <button class="keyBoardCharacter btn" {char} btnstate="notUsed"
          >{char}</button
        >
      {/each}
      <button class="keyBoardCharacter del" char="Del">Del</button>
    </div>
  </div>
</div>

<style>
  .keyBoard {
    position: relative;
    max-width: 100%;
    max-height: 250px;
    width: 100%;
    height: 100%;
  }
  .keyBoardWrap {
    position: relative;
    width: 95%;
    height: 95%;
    margin: auto;
    top: 3%;
  }
  .row {
    position: relative;
    display: flex;
    width: 100%;
    height: 58px;
    justify-content: center;
    align-items: center;
    gap: 5px;
    margin: 0 auto 8px;
  }
  .space {
    width: 12px;
  }
  .keyBoardCharacter {
    position: relative;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: 43px;
    height: 58px;
    border: none;
    outline: none;
    text-transform: uppercase;
    user-select: none;
    font-family: inherit;
    font-weight: bold;
    padding: 0;
    cursor: pointer;
    border-radius: 4px;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0.3);
    transition: ease 0.5s all;
  }
  .enter {
    background-color: #d3d6da;
    width: 65px;
  }
  .del {
    width: 65px;
    background-color: #d3d6da;
  }
  .keyBoardCharacter[btnstate="notUsed"] {
    background-color: #d3d6da;
    color: black;
  }
  /* .keyBoardCharacter[btnstate="coincide"] {
    background-color: #6aaa64;
    color: #ffffff;
  }
  .keyBoardCharacter[btnstate="used"] {
    background: #787c7e;
    color: #ffffff;
  }
  .keyBoardCharacter[btnstate="includesChar"] {
    background-color: #c9b458;
    color: #ffffff;
  } */
</style>
