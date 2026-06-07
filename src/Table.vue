<template>
    <div
        v-if="data"
        class="relative"
        :class="{ '!pointer-events-none': data.loading || data.querying }"
    >
        <div v-if="data.options.style.type == 'table'" class="overflow-x-auto">
            <table
                :id="data.id"
                class="tabler bg-white"
                :class="data.options.style.classes"
            >
                <thead v-if="data.options.disable.head != true">
                    <tr>
                        <TablerHead
                            v-for="th in data.head"
                            :key="th.data.column"
                            :col="th"
                            @sort="changeSort"
                        />
                    </tr>
                </thead>
                <tbody v-if="data.options.disable.body != true">
                    <tr v-if="data.body.length < 1">
                        <td class="text-center p-3" :colspan="data.head.length">
                            No results.
                        </td>
                    </tr>
                    <template v-else>
                        <template v-for="(tr, ind) in data.filtered" :key="tr">
                            <tr
                                v-show="Tabler.isIndexShown(data, ind)"
                                class="even:bg-slate-50"
                                data-id="tr[data.options.rowKey]"
                                @click="clickRow($event, tr)"
                            >
                                <template
                                    v-for="th in data.head"
                                    :key="th.data.column"
                                >
                                    <TablerBody :col="th" :row="tr" />
                                </template>
                            </tr>
                        </template>
                    </template>
                </tbody>
            </table>
        </div>
        <ul
            v-else
            :id="data.id"
            class="tabler list-none"
            :class="data.options.style.classes"
        >
            <li v-if="data.body.length < 1" class="text-center p-3">
                No results.
            </li>
            <template v-for="(row, ind) in data.filtered" :key="row">
                <li
                    v-show="Tabler.isIndexShown(data, ind)"
                    data-id="row[data.options.rowKey]"
                    @click="clickRow($event, row)"
                >
                    <slot v-bind="row" />
                </li>
            </template>
        </ul>
        <div
            v-if="data.options.disable.paging != true"
            class="mt-2 rounded-md bg-slate-100 p-2 flex justify-between items-center"
        >
            <p
                v-if="data.filtered.length < 1"
                class="text-center pl-2 leading-tight"
            >
                No results.
            </p>
            <p v-else class="text-center pl-2 leading-tight">
                Showing {{ data.paging.skip + 1 }}&thinsp;-&thinsp;{{
                    Math.min(
                        data.paging.skip + data.paging.take,
                        data.paging.count,
                    )
                }}
                of {{ data.paging.count }}
            </p>
            <div class="ml-4 flex flex-nowrap">
                <select
                    class="form-select mr-3 py-1 w-20 border border-slate-300"
                    @change="changeTake"
                >
                    <option
                        v-for="o in data.paging.options"
                        :key="o"
                        :selected="o == data.paging.take"
                    >
                        {{ o }}
                    </option>
                    <option
                        v-if="!data.options.ajax.remote"
                        :value="data.body.length"
                        :selected="
                            data.paging.take >= data.body.length &&
                            data.paging.options.indexOf(data.paging.take) < 0
                        "
                    >
                        All
                    </option>
                </select>
                <div
                    v-show="data.paging.last > 1"
                    class="row flex rounded-md border border-r-0 border-slate-300 overflow-hidden"
                >
                    <button
                        :disabled="data.paging.page <= 2"
                        @click="changePage($event, 'first')"
                        class="text-center min-w-8 bg-white border-r border-slate-300 py-1 px-2 text-sm transition-all shadow-xs hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                    >
                        <ChevronsLeftIcon class="w-4 h-4" />
                    </button>
                    <button
                        :disabled="data.paging.page <= 1"
                        @click="changePage($event, 'prev')"
                        class="text-center min-w-8 bg-white border-r border-slate-300 py-1 px-2 text-sm transition-all shadow-xs hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                    >
                        <ChevronLeftIcon class="w-4 h-4" />
                    </button>
                    <template v-for="p in data.paging.list" :key="p">
                        <button
                            @click="changePage($event, p)"
                            class="text-center min-w-8 bg-white border-r border-slate-300 py-1 px-2 text-sm transition-all shadow-xs hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                            :class="{
                                'text-white bg-slate-900':
                                    p == data.paging.page,
                            }"
                            :disabled="p == data.paging.page"
                            type="button"
                        >
                            {{ p }}
                        </button>
                    </template>
                    <button
                        :disabled="data.paging.page >= data.paging.last - 1"
                        @click="changePage($event, 'next')"
                        class="text-center min-w-8 bg-white border-r border-slate-300 py-1 px-2 text-sm transition-all shadow-xs hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                    >
                        <ChevronRightIcon class="w-4 h-4" />
                    </button>
                    <button
                        :disabled="data.paging.page >= data.paging.last - 2"
                        @click="changePage($event, 'last')"
                        class="text-center min-w-8 bg-white border-r border-slate-300 py-1 px-2 text-sm transition-all shadow-xs hover:shadow-lg text-slate-600 hover:text-white hover:bg-slate-800 hover:border-slate-800 active:border-slate-800 active:text-white active:bg-slate-800 disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
                        type="button"
                    >
                        <ChevronsRightIcon class="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
        <div
            class="absolute top-0 w-full left-0 h-full backdrop-filter backdrop-blur-xs pointer-events-none z-10 opacity-75 hidden"
            :class="{ '!block': data.querying }"
        />
    </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import TablerHead from "./HeadCell.vue";
import TablerBody from "./BodyCell.vue";
import { Tabler } from "./index";
import { TablerDefaults } from "./store";

const props = defineProps({
    id: {
        type: String,
        default: TablerDefaults.table.id,
    },
});

const emit = defineEmits<{
    (e: "paginate", payload: any): void;
    (e: "sort", payload: any): void;
    (e: "clickRow", payload: any): void;
}>();

const data = computed(() => Tabler.get(props.id as string));

const changePage = (evt: Event | null, v: any) => {
    if (evt) evt.preventDefault();
    emit("paginate", Tabler.changePage(props.id, v));
};

const changeTake = (evt: Event) => {
    evt.preventDefault();
    const target = evt.target as HTMLSelectElement;
    emit("paginate", Tabler.changeTake(props.id, +target.value));
};

const changeSort = (evt: Event | null, col: any) => {
    if (evt) evt.preventDefault();
    emit("sort", Tabler.changeSort(props.id, col));
};

const clickRow = (evt: Event | null, row: any) => {
    const target = evt?.target as HTMLElement | undefined;
    if (
        target &&
        target.closest &&
        target.closest("a, button, input, select, textarea")
    )
        return;
    if (evt) evt.preventDefault();
    emit("clickRow", row);
};
</script>
