<script>
  import { bind, onMount } from "svelte/internal";

  export let inputAnswerChar = [];
  export let answerWord = "";
  let enterCheck = true;
  let answerCheckDone = false;
  let setColorStyle = [
    { style: undefined },
    { style: undefined },
    { style: undefined },
    { style: undefined },
    { style: undefined },
  ];
  let bindList;
  let ready;
  onMount(()=>{
    ready=true;
  })
  $: {
    if(ready){
      const tileElement = bindList.querySelectorAll(".answerTile")
      let tempArr=[];
      if(bindList.getAttribute("useAttribute")==="false"){
        // console.log(inputAnswerChar)
        for(let i=0; i<5;i++){
          if(inputAnswerChar[i]===null || inputAnswerChar[i]===undefined){
            tempArr = [...tempArr, i];
          }
          else{
            tempArr.splice(i,1);
          }
        }
        inputAnswerChar.forEach((word,index)=>{
          if(word!==""){
            tileElement[index].setAttribute("inputText","true")
          }
        })
        tempArr.forEach((index)=>{
          tileElement[index].setAttribute("inputText","false")
        })
        // console.log(tempArr)
    }
  }
}

  function colorStyle(index, backColor) {
    setColorStyle[index] = {
      backgroundColor: `${backColor}`,
      border: `${backColor} solid 1px`,
      color: "#ffffff",
    };
  }
  function overlap(array, word, trans, index) {
    let newAnswer = array.split("");
    let retrunArray;
    newAnswer.splice(index, 1, trans);
    retrunArray = [...newAnswer].join("");
    return retrunArray;
  }
  $: enter = inputAnswerChar[5] === "Enter" ? true : false;
  $: if (enter) {
    if (enterCheck) {
      enterCheck = false; //중복실행 방지
      let char = [...inputAnswerChar].join("").replace(/Enter/, "");
      let answer = [...answerWord].join("");
      char.split("").forEach((word, i) => {
        console.log(`불일치:${answer}`);
        colorStyle(i, "#787C7E");
      });
      char.split("").forEach((word, i) => {
        if (answer.includes(word) && answer[i] === word) {
          answer = overlap(answer, word, "#", i);
          char = overlap(char, word, "*", i);
          colorStyle(i, "#6AAA6a");
        }
      });
      char.split("").forEach((word, i) => {
        if (answer.includes(word) && answer[i] !== word) {
          answer = overlap(answer, word, "#", answer.indexOf(word));
          colorStyle(i, "#C9B458");
        }
      });
      answerCheckDone = true;
    }
  }
  $: if (answerCheckDone) {
    const tile = bindList.querySelectorAll(".answerTile");
    const tileArr = ["tile1", "tile2", "tile3", "tile4", "tile5"];
    bindList.setAttribute("useAttribute", "true");
    setColorStyle.forEach((style, index) => {
      tile[index].setAttribute("inputText","false")
      tile[index].classList.add(tileArr[index]);
      bindList.children[index].style.backgroundColor = style.backgroundColor;
      bindList.children[index].style.border = style.border;
      bindList.children[index].style.color = style.color;
    });
  }

</script>

<div class="answerList" bind:this={bindList} useAttribute="false">
  <div class="answerTile " inputText="false">
    {inputAnswerChar[0] === undefined ? "" : inputAnswerChar[0]}
  </div>
  <div class="answerTile " inputText="false">
    {inputAnswerChar[1] === undefined ? "" : inputAnswerChar[1]}
  </div>
  <div class="answerTile " inputText="false">
    {inputAnswerChar[2] === undefined ? "" : inputAnswerChar[2]}
  </div>
  <div class="answerTile " inputText="false">
    {inputAnswerChar[3] === undefined ? "" : inputAnswerChar[3]}
  </div>
  <div class="answerTile " inputText="false">
    {inputAnswerChar[4] === undefined ? "" : inputAnswerChar[4]}
  </div>
</div>

<style>
  .answerList {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    grid-gap: 5px;
  }
  .answerTile {
    position: relative;
    width: 100%;
    height: 100%;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    line-height: 2rem;
    vertical-align: middle;
    font-size: 2rem;
    box-sizing: border-box;
    font-weight: bold;
    text-transform: uppercase;
    user-select: none;
    border: 2px rgb(194, 194, 194) solid;
  }
  :global(.tile1) {
    transition: backgroundColor,border, 0.4;
    transition-delay: 0.4s;
    animation: rotateTile 0.4s;
    animation-delay: 0.2s;
  }
  :global(.tile2) {
    transition: border, backgroundColor, 0.4;
    transition-delay: 0.8s;
    animation: rotateTile 0.4s;
    animation-delay: 0.6s;
  }
  :global(.tile3) {
    transition: border, backgroundColor, 0.4;
    transition-delay: 1.2s;
    animation: rotateTile 0.4s;
    animation-delay: 1s;
  }
  :global(.tile4) {
    transition: border, backgroundColor, 0.4;
    transition-delay: 1.6s;
    animation: rotateTile 0.4s;
    animation-delay: 1.4s;
  }
  :global(.tile5) {
    transition: border, backgroundColor, 0.4;
    transition-delay: 2s;
    animation: rotateTile 0.4s;
    animation-delay: 1.8s;
  }

  :global(.answerTile[inputText="true"]) {
    animation: bounc 0.2s;
    animation-fill-mode: both;
  }
  @keyframes rotateTile {
    0% {
      transform: rotateX(0deg);
    }
    50% {
      transform: rotateX(90deg);
    }
    100% {
      transform: rotateX(0deg);
    }
  }
  @keyframes bounc {
    0% {
      transform: scale(1.13);
    }
    100% {
      transform: scale(1);
      border: black 1.2px solid;
    }
  }
</style>
