<script>
  import Tiles from "./AnswerInners.svelte";
  import { each, onMount, beforeUpdate } from "svelte/internal";
  export let answerArrayList = []; //2차원 배열로 이용할것
  export let answer = "";
  let tileListAmount = new Array(6); //만들 Tiles 개수 new Array(개수) 안에다 적기
</script>

{#each tileListAmount as tile, i}
  <Tiles
    inputAnswerChar={answerArrayList[i] === undefined ? [] : answerArrayList[i]}
    answerWord={answer}
  />
{/each}

<style>
</style>
