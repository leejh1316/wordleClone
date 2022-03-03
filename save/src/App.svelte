<script>
  import { each, getContext, setContext, text } from "svelte/internal";
  import Answer from "./Answer.svelte";
  import KeyBoard from "./KeyBoard.svelte";
  import { words, correctAnswer } from "./answerList.js";
  console.log(correctAnswer);
  let answerShow=false;
  let char = [[]];
  let exportKeyCode;
  let dispatchWord = "";
  let nowCharArrayIndex = 0;
  let keyboardLetter = [];
  function keyDownEvent(e) {
	  if(!answerShow){
    exportKeyCode = e.keyCode;
    if (
      e.keyCode >= 65 &&
      e.keyCode <= 90 &&
      char[nowCharArrayIndex].length < 5
    ) {
      //input a~z
      char[nowCharArrayIndex] = [...char[nowCharArrayIndex], e.key];
    } else if (e.keyCode === 13 && char[nowCharArrayIndex].length === 5 && nowCharArrayIndex<6) {
      //enter
	  if(char[nowCharArrayIndex].join('')===correctAnswer.word){
		  console.log("정답!")
		  answerShow=true;
		}
		else if(char[nowCharArrayIndex].join('')!=correctAnswer.word&&nowCharArrayIndex==5){
			console.log("실패")
			answerShow=true;
	  }
      keyboardLetter = [...keyboardLetter, char[nowCharArrayIndex].join("")];
      char[nowCharArrayIndex] = [...char[nowCharArrayIndex], e.key];
      char.push([]);
      nowCharArrayIndex += 1;
	  console.log(nowCharArrayIndex)
    } else if (e.keyCode === 8) {
      //backspace-delete
      const delArray = [...char[nowCharArrayIndex]];
      delArray.pop();
      char[nowCharArrayIndex] = delArray;
    }
    setTimeout(() => {
      exportKeyCode = null;
    }, 0);
}
  }
  function getBtnCharArray(e) {
	  if(!answerShow){
    dispatchWord = e.detail.word;
    // console.dir(dispatchWord);
    if (dispatchWord === "Del") {
      const delArray = [...char[nowCharArrayIndex]];
      delArray.pop();
      char[nowCharArrayIndex] = delArray;
    } else if (
      dispatchWord === "Enter" &&
      char[nowCharArrayIndex].length === 5
    ) {
      keyboardLetter = [...keyboardLetter, char[nowCharArrayIndex].join("")];
      char[nowCharArrayIndex] = [...char[nowCharArrayIndex], "Enter"];
      char.push([]);
      nowCharArrayIndex += 1;
    } else if (char[nowCharArrayIndex].length < 5 && dispatchWord !== "Enter") {
      char[nowCharArrayIndex] = [...char[nowCharArrayIndex], dispatchWord];
    }
}
  }
</script>

<svelte:window on:keydown={keyDownEvent} />

<main>
  <div class="header">Wordle</div>
  <div class="game">
    <div class="mainWordle">
      <div class="answerSheet">
        <div class="answerItemWrap">
          <Answer answerArrayList={char} answer={correctAnswer.word} />
        </div>
      </div>
      <!-- <div class="keyBoard" /> -->
      <KeyBoard
        on:btnCharArray={getBtnCharArray}
        keyboardArray={keyboardLetter}
        answer={correctAnswer.word}
        KeyCode={exportKeyCode}
      />
    </div>
  </div>
  {#if answerShow}
  <div class="answerShow">{correctAnswer.word}</div>
  {/if}
</main>

<style>
  main {
    position: relative;
    display: grid;
    grid-template-columns: 100%;
    grid-template-rows: 6% 94%;
    width: 100%;
    height: 100%;
    padding: 0;
    margin: 0;
  }
  .header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    border-bottom: black 1px solid;
  }
  .game {
    position: relative;
    width: 100%;
    height: 100%;
  }
  .mainWordle {
    position: relative;
    display: grid;
    flex-direction: column;
    grid-template-columns: 100%;
    grid-template-rows: 70% 30%;
    max-width: 500px;
    width: 100%;
    max-height: 896px;
    height: 100%;
    /* background-color: blueviolet; */
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .answerSheet {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
  }
  .answerItemWrap {
    position: relative;
    display: grid;
    grid-template-rows: repeat(6, 1fr);
    grid-gap: 5px;
    max-width: 350px;
    padding: 10px;
    width: 100%;
    height: 100%;
    max-height: 420px;
    top: 20px;
    /* background-color: beige; */
    box-sizing: border-box;
  }
  .answerShow{
	  position: absolute;
	  width: 150px;
	  height: 60px;
	  background-color: black;
	  color: white;
	  left: 50%;
	  top: 30%;
	  display: inline-flex;
	  justify-content: center;
	  align-items: center;
	  font-weight: bold;
	  text-transform: uppercase;
	  border-radius: 8px;
	  font-size: 17px;
	  box-shadow: black 0px 0px 7px;
	  transform: translate(-50%,-50%);
	  opacity: 0;
	  animation: fadeIn 0.6s;
	  animation-fill-mode: both;
	  animation-delay: 2.3s;
  }
  @keyframes fadeIn{
	  from{
		  opacity: 0;
	  }
	  to{
		  opacity: 1;
	  }
  }
</style>
