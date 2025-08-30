<script>
  export let page;
  const border = window.theme('border') + " border-t-2";
  const isOdd = page % 2 === 1;
</script>

<div class="md:max-w-[40rem] mx-auto">
  <div class="grid grid-cols-12 items-center text-sm">
    <div class="col-span-10 {border} {isOdd ? 'order-1' : 'order-3'}"></div>
    <div class="col-span-1 flex items-center order-2">
      <div class="flex-1 {border}"></div>
      <span class="text-center px-3">{page}</span>
      <div class="flex-1 {border}"></div>
    </div>
    <div class="col-span-1 {border} {isOdd ? 'order-3' : 'order-1'}"></div>
  </div>
</div>
