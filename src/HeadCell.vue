<script setup lang="ts">
import { onMounted, ref } from "vue";
import { cloneDeep } from "lodash";
import { TablerDefaults } from "./store";

const props = defineProps({
    col: {
        type: Object as any,
        default: () => cloneDeep(TablerDefaults.columns),
    },
});

const emit = defineEmits<{ (e: "sort", ev?: Event, col?: any): void }>();

const transformed = ref<string>("");
const isVertical = ref<boolean>(
    props.col.style.head.xAlign == "rotate" ||
        props.col.style.head.yAlign == "rotate",
);

const defaultHTML = (col: Record<string, any>): string => {
    return col.data.title;
};

onMounted(() => {
    transformed.value =
        props.col.style.head.formatter != null
            ? props.col.style.head.formatter(props.col)
            : defaultHTML(props.col);
});
</script>
<template>
    <th
        :class="`${isVertical ? 'vertical' : ''} ${props.col.style.head.classes.includes('w-') ? props.col.style.head.classes : ''}`"
        :valign="props.col.style.head.yAlign"
    >
        <span
            v-if="props.col.sort.hide"
            :class="`w-full text-${props.col.style.head.xAlign} ${props.col.style.head.classes}`"
            v-html="transformed"
        />
        <button
            v-else
            type="button"
            @click="emit('sort', $event, props.col)"
            :class="`w-full flex ${props.col.style.head.classes}`"
        >
            <span
                :class="`grow-1 shrink-0 text-${props.col.style.head.xAlign}`"
                v-html="transformed"
            />
            <span
                class="grow-0 shrink-0 w-3 h-3"
                :class="{
                    'mx-1': props.col.data.title != '',
                    'mb-1': props.col.data.title == '',
                    'mt-2': isVertical,
                }"
            >
                <ArrowUpDownIcon
                    v-if="!props.col.sort.current"
                    class="w-3 h-3 text-slate-500"
                />
                <ArrowDownIcon
                    v-else-if="props.col.sort.asc"
                    class="w-3 h-3 text-slate-500"
                />
                <ArrowUpIcon v-else class="w-3 h-3 text-slate-500" />
            </span>
        </button>
    </th>
</template>
