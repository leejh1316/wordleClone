
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function each(items, fn) {
        let str = '';
        for (let i = 0; i < items.length; i += 1) {
            str += fn(items[i], i);
        }
        return str;
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.4' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\AnswerInners.svelte generated by Svelte v3.46.4 */

    const { console: console_1$1 } = globals;
    const file$2 = "src\\AnswerInners.svelte";

    function create_fragment$3(ctx) {
    	let div5;
    	let div0;

    	let t0_value = (/*inputAnswerChar*/ ctx[0][0] === undefined
    	? ""
    	: /*inputAnswerChar*/ ctx[0][0]) + "";

    	let t0;
    	let t1;
    	let div1;

    	let t2_value = (/*inputAnswerChar*/ ctx[0][1] === undefined
    	? ""
    	: /*inputAnswerChar*/ ctx[0][1]) + "";

    	let t2;
    	let t3;
    	let div2;

    	let t4_value = (/*inputAnswerChar*/ ctx[0][2] === undefined
    	? ""
    	: /*inputAnswerChar*/ ctx[0][2]) + "";

    	let t4;
    	let t5;
    	let div3;

    	let t6_value = (/*inputAnswerChar*/ ctx[0][3] === undefined
    	? ""
    	: /*inputAnswerChar*/ ctx[0][3]) + "";

    	let t6;
    	let t7;
    	let div4;

    	let t8_value = (/*inputAnswerChar*/ ctx[0][4] === undefined
    	? ""
    	: /*inputAnswerChar*/ ctx[0][4]) + "";

    	let t8;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			t6 = text(t6_value);
    			t7 = space();
    			div4 = element("div");
    			t8 = text(t8_value);
    			attr_dev(div0, "class", "answerTile  svelte-fxvyb6");
    			attr_dev(div0, "inputtext", "false");
    			add_location(div0, file$2, 102, 2, 3202);
    			attr_dev(div1, "class", "answerTile  svelte-fxvyb6");
    			attr_dev(div1, "inputtext", "false");
    			add_location(div1, file$2, 105, 2, 3325);
    			attr_dev(div2, "class", "answerTile  svelte-fxvyb6");
    			attr_dev(div2, "inputtext", "false");
    			add_location(div2, file$2, 108, 2, 3448);
    			attr_dev(div3, "class", "answerTile  svelte-fxvyb6");
    			attr_dev(div3, "inputtext", "false");
    			add_location(div3, file$2, 111, 2, 3571);
    			attr_dev(div4, "class", "answerTile  svelte-fxvyb6");
    			attr_dev(div4, "inputtext", "false");
    			add_location(div4, file$2, 114, 2, 3694);
    			attr_dev(div5, "class", "answerList svelte-fxvyb6");
    			attr_dev(div5, "useattribute", "false");
    			add_location(div5, file$2, 101, 0, 3132);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div1, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div2, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div3);
    			append_dev(div3, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, t8);
    			/*div5_binding*/ ctx[8](div5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*inputAnswerChar*/ 1 && t0_value !== (t0_value = (/*inputAnswerChar*/ ctx[0][0] === undefined
    			? ""
    			: /*inputAnswerChar*/ ctx[0][0]) + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*inputAnswerChar*/ 1 && t2_value !== (t2_value = (/*inputAnswerChar*/ ctx[0][1] === undefined
    			? ""
    			: /*inputAnswerChar*/ ctx[0][1]) + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*inputAnswerChar*/ 1 && t4_value !== (t4_value = (/*inputAnswerChar*/ ctx[0][2] === undefined
    			? ""
    			: /*inputAnswerChar*/ ctx[0][2]) + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*inputAnswerChar*/ 1 && t6_value !== (t6_value = (/*inputAnswerChar*/ ctx[0][3] === undefined
    			? ""
    			: /*inputAnswerChar*/ ctx[0][3]) + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*inputAnswerChar*/ 1 && t8_value !== (t8_value = (/*inputAnswerChar*/ ctx[0][4] === undefined
    			? ""
    			: /*inputAnswerChar*/ ctx[0][4]) + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			/*div5_binding*/ ctx[8](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function overlap$1(array, word, trans, index) {
    	let newAnswer = array.split("");
    	let retrunArray;
    	newAnswer.splice(index, 1, trans);
    	retrunArray = [...newAnswer].join("");
    	return retrunArray;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let enter;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AnswerInners', slots, []);
    	let { inputAnswerChar = [] } = $$props;
    	let { answerWord = "" } = $$props;
    	let enterCheck = true;
    	let answerCheckDone = false;

    	let setColorStyle = [
    		{ style: undefined },
    		{ style: undefined },
    		{ style: undefined },
    		{ style: undefined },
    		{ style: undefined }
    	];

    	let bindList;
    	let ready;

    	onMount(() => {
    		$$invalidate(6, ready = true);
    	});

    	function colorStyle(index, backColor) {
    		$$invalidate(
    			5,
    			setColorStyle[index] = {
    				backgroundColor: `${backColor}`,
    				border: `${backColor} solid 1px`,
    				color: "#ffffff"
    			},
    			setColorStyle
    		);
    	}

    	const writable_props = ['inputAnswerChar', 'answerWord'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1$1.warn(`<AnswerInners> was created with unknown prop '${key}'`);
    	});

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			bindList = $$value;
    			(((((($$invalidate(1, bindList), $$invalidate(4, answerCheckDone)), $$invalidate(5, setColorStyle)), $$invalidate(7, enter)), $$invalidate(3, enterCheck)), $$invalidate(0, inputAnswerChar)), $$invalidate(2, answerWord));
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('inputAnswerChar' in $$props) $$invalidate(0, inputAnswerChar = $$props.inputAnswerChar);
    		if ('answerWord' in $$props) $$invalidate(2, answerWord = $$props.answerWord);
    	};

    	$$self.$capture_state = () => ({
    		bind,
    		onMount,
    		inputAnswerChar,
    		answerWord,
    		enterCheck,
    		answerCheckDone,
    		setColorStyle,
    		bindList,
    		ready,
    		colorStyle,
    		overlap: overlap$1,
    		enter
    	});

    	$$self.$inject_state = $$props => {
    		if ('inputAnswerChar' in $$props) $$invalidate(0, inputAnswerChar = $$props.inputAnswerChar);
    		if ('answerWord' in $$props) $$invalidate(2, answerWord = $$props.answerWord);
    		if ('enterCheck' in $$props) $$invalidate(3, enterCheck = $$props.enterCheck);
    		if ('answerCheckDone' in $$props) $$invalidate(4, answerCheckDone = $$props.answerCheckDone);
    		if ('setColorStyle' in $$props) $$invalidate(5, setColorStyle = $$props.setColorStyle);
    		if ('bindList' in $$props) $$invalidate(1, bindList = $$props.bindList);
    		if ('ready' in $$props) $$invalidate(6, ready = $$props.ready);
    		if ('enter' in $$props) $$invalidate(7, enter = $$props.enter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*inputAnswerChar*/ 1) {
    			$$invalidate(7, enter = inputAnswerChar[5] === "Enter" ? true : false);
    		}

    		if ($$self.$$.dirty & /*enter, enterCheck, inputAnswerChar, answerWord*/ 141) {
    			if (enter) {
    				if (enterCheck) {
    					$$invalidate(3, enterCheck = false); //중복실행 방지
    					let char = [...inputAnswerChar].join("").replace(/Enter/, "");
    					let answer = [...answerWord].join("");

    					char.split("").forEach((word, i) => {
    						console.log(`불일치:${answer}`);
    						colorStyle(i, "#787C7E");
    					});

    					char.split("").forEach((word, i) => {
    						if (answer.includes(word) && answer[i] === word) {
    							answer = overlap$1(answer, word, "#", i);
    							char = overlap$1(char, word, "*", i);
    							colorStyle(i, "#6AAA6a");
    						}
    					});

    					char.split("").forEach((word, i) => {
    						if (answer.includes(word) && answer[i] !== word) {
    							answer = overlap$1(answer, word, "#", answer.indexOf(word));
    							colorStyle(i, "#C9B458");
    						}
    					});

    					$$invalidate(4, answerCheckDone = true);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*answerCheckDone, bindList, setColorStyle*/ 50) {
    			if (answerCheckDone) {
    				const tile = bindList.querySelectorAll(".answerTile");
    				const tileArr = ["tile1", "tile2", "tile3", "tile4", "tile5"];
    				bindList.setAttribute("useAttribute", "true");

    				setColorStyle.forEach((style, index) => {
    					tile[index].setAttribute("inputText", "false");
    					tile[index].classList.add(tileArr[index]);
    					$$invalidate(1, bindList.children[index].style.backgroundColor = style.backgroundColor, bindList);
    					$$invalidate(1, bindList.children[index].style.border = style.border, bindList);
    					$$invalidate(1, bindList.children[index].style.color = style.color, bindList);
    				});
    			}
    		}

    		if ($$self.$$.dirty & /*ready, bindList, inputAnswerChar*/ 67) {
    			{
    				if (ready) {
    					const tileElement = bindList.querySelectorAll(".answerTile");
    					let tempArr = [];

    					if (bindList.getAttribute("useAttribute") === "false") {
    						// console.log(inputAnswerChar)
    						for (let i = 0; i < 5; i++) {
    							if (inputAnswerChar[i] === null || inputAnswerChar[i] === undefined) {
    								tempArr = [...tempArr, i];
    							} else {
    								tempArr.splice(i, 1);
    							}
    						}

    						inputAnswerChar.forEach((word, index) => {
    							if (word !== "") {
    								tileElement[index].setAttribute("inputText", "true");
    							}
    						});

    						tempArr.forEach(index => {
    							tileElement[index].setAttribute("inputText", "false");
    						});
    					} // console.log(tempArr)
    				}
    			}
    		}
    	};

    	return [
    		inputAnswerChar,
    		bindList,
    		answerWord,
    		enterCheck,
    		answerCheckDone,
    		setColorStyle,
    		ready,
    		enter,
    		div5_binding
    	];
    }

    class AnswerInners extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { inputAnswerChar: 0, answerWord: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AnswerInners",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get inputAnswerChar() {
    		throw new Error("<AnswerInners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inputAnswerChar(value) {
    		throw new Error("<AnswerInners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get answerWord() {
    		throw new Error("<AnswerInners>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answerWord(value) {
    		throw new Error("<AnswerInners>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\Answer.svelte generated by Svelte v3.46.4 */

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (9:0) {#each tileListAmount as tile, i}
    function create_each_block$1(ctx) {
    	let tiles;
    	let current;

    	tiles = new AnswerInners({
    			props: {
    				inputAnswerChar: /*answerArrayList*/ ctx[0][/*i*/ ctx[5]] === undefined
    				? []
    				: /*answerArrayList*/ ctx[0][/*i*/ ctx[5]],
    				answerWord: /*answer*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tiles.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tiles, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tiles_changes = {};

    			if (dirty & /*answerArrayList*/ 1) tiles_changes.inputAnswerChar = /*answerArrayList*/ ctx[0][/*i*/ ctx[5]] === undefined
    			? []
    			: /*answerArrayList*/ ctx[0][/*i*/ ctx[5]];

    			if (dirty & /*answer*/ 2) tiles_changes.answerWord = /*answer*/ ctx[1];
    			tiles.$set(tiles_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tiles.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tiles.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tiles, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(9:0) {#each tileListAmount as tile, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*tileListAmount*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*answerArrayList, undefined, answer*/ 3) {
    				each_value = /*tileListAmount*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Answer', slots, []);
    	let { answerArrayList = [] } = $$props;
    	let { answer = "" } = $$props;
    	let tileListAmount = new Array(6); //만들 Tiles 개수 new Array(개수) 안에다 적기
    	const writable_props = ['answerArrayList', 'answer'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Answer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('answerArrayList' in $$props) $$invalidate(0, answerArrayList = $$props.answerArrayList);
    		if ('answer' in $$props) $$invalidate(1, answer = $$props.answer);
    	};

    	$$self.$capture_state = () => ({
    		Tiles: AnswerInners,
    		each,
    		onMount,
    		beforeUpdate,
    		answerArrayList,
    		answer,
    		tileListAmount
    	});

    	$$self.$inject_state = $$props => {
    		if ('answerArrayList' in $$props) $$invalidate(0, answerArrayList = $$props.answerArrayList);
    		if ('answer' in $$props) $$invalidate(1, answer = $$props.answer);
    		if ('tileListAmount' in $$props) $$invalidate(2, tileListAmount = $$props.tileListAmount);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [answerArrayList, answer, tileListAmount];
    }

    class Answer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { answerArrayList: 0, answer: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Answer",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get answerArrayList() {
    		throw new Error("<Answer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answerArrayList(value) {
    		throw new Error("<Answer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get answer() {
    		throw new Error("<Answer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<Answer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\KeyBoard.svelte generated by Svelte v3.46.4 */
    const file$1 = "src\\KeyBoard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    // (88:6) {#each rowFir as char}
    function create_each_block_2(ctx) {
    	let button;
    	let t_value = /*char*/ ctx[13] + "";
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "keyBoardCharacter btn svelte-12xsh3s");
    			attr_dev(button, "char", /*char*/ ctx[13]);
    			attr_dev(button, "btnstate", "notUsed");
    			add_location(button, file$1, 88, 8, 2899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(88:6) {#each rowFir as char}",
    		ctx
    	});

    	return block;
    }

    // (96:6) {#each rowSec as char}
    function create_each_block_1(ctx) {
    	let button;
    	let t_value = /*char*/ ctx[13] + "";
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "keyBoardCharacter btn svelte-12xsh3s");
    			attr_dev(button, "char", /*char*/ ctx[13]);
    			attr_dev(button, "btnstate", "notUsed");
    			add_location(button, file$1, 96, 8, 3124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(96:6) {#each rowSec as char}",
    		ctx
    	});

    	return block;
    }

    // (105:6) {#each rowThr as char}
    function create_each_block(ctx) {
    	let button;
    	let t_value = /*char*/ ctx[13] + "";
    	let t;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(t_value);
    			attr_dev(button, "class", "keyBoardCharacter btn svelte-12xsh3s");
    			attr_dev(button, "char", /*char*/ ctx[13]);
    			attr_dev(button, "btnstate", "notUsed");
    			add_location(button, file$1, 105, 8, 3419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(105:6) {#each rowThr as char}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let div6;
    	let div5;
    	let div0;
    	let t0;
    	let div3;
    	let div1;
    	let t1;
    	let t2;
    	let div2;
    	let t3;
    	let div4;
    	let button0;
    	let t5;
    	let t6;
    	let button1;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*rowFir*/ ctx[1];
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*rowSec*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*rowThr*/ ctx[3];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div5 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t0 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t1 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t2 = space();
    			div2 = element("div");
    			t3 = space();
    			div4 = element("div");
    			button0 = element("button");
    			button0.textContent = "Enter";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Del";
    			attr_dev(div0, "class", "row svelte-12xsh3s");
    			add_location(div0, file$1, 86, 4, 2842);
    			attr_dev(div1, "class", "space svelte-12xsh3s");
    			add_location(div1, file$1, 94, 6, 3063);
    			attr_dev(div2, "class", "space svelte-12xsh3s");
    			add_location(div2, file$1, 100, 6, 3248);
    			attr_dev(div3, "class", "row row2 svelte-12xsh3s");
    			add_location(div3, file$1, 93, 4, 3033);
    			attr_dev(button0, "class", "keyBoardCharacter enter svelte-12xsh3s");
    			attr_dev(button0, "char", "Enter");
    			add_location(button0, file$1, 103, 6, 3312);
    			attr_dev(button1, "class", "keyBoardCharacter del svelte-12xsh3s");
    			attr_dev(button1, "char", "Del");
    			add_location(button1, file$1, 109, 6, 3543);
    			attr_dev(div4, "class", "row svelte-12xsh3s");
    			add_location(div4, file$1, 102, 4, 3287);
    			attr_dev(div5, "class", "keyBoardWrap svelte-12xsh3s");
    			add_location(div5, file$1, 85, 2, 2790);
    			attr_dev(div6, "class", "keyBoard svelte-12xsh3s");
    			add_location(div6, file$1, 84, 0, 2744);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div5);
    			append_dev(div5, div0);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div0, null);
    			}

    			append_dev(div5, t0);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div3, t1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div3, null);
    			}

    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div5, t3);
    			append_dev(div5, div4);
    			append_dev(div4, button0);
    			append_dev(div4, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}

    			append_dev(div4, t6);
    			append_dev(div4, button1);
    			/*div5_binding*/ ctx[8](div5);

    			if (!mounted) {
    				dispose = listen_dev(div6, "click", /*btnClick*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*rowFir*/ 2) {
    				each_value_2 = /*rowFir*/ ctx[1];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*rowSec*/ 4) {
    				each_value_1 = /*rowSec*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div3, t2);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*rowThr*/ 8) {
    				each_value = /*rowThr*/ ctx[3];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, t6);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_each(each_blocks_2, detaching);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			/*div5_binding*/ ctx[8](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function overlap(array, word) {
    	let newAnswer = array.split("");
    	let retrunArray;
    	newAnswer.splice(newAnswer.indexOf(word), 1, "#");
    	retrunArray = [...newAnswer].join("");
    	return retrunArray;
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
    		newArray[2].forEach(word => {
    			keyBtnForEach(keyBtns, "#787c7e", word);
    		});
    	}
    }

    function keyBtnForEach(elementList, backColor, word) {
    	elementList.forEach(btElement => {
    		if (btElement.getAttribute("char") === word) {
    			if (btElement.style.backgroundColor !== "rgb(106, 170, 100)") {
    				btElement.style.backgroundColor = `${backColor}`;
    				btElement.style.color = "#ffffff";
    			}
    		}
    	});
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('KeyBoard', slots, []);
    	let btnChar = "";
    	let { keyboardArray = [] } = $$props;
    	let { answer } = $$props;
    	let { KeyCode } = $$props;
    	let btnIndex = 0;
    	let keyBind;
    	const rowFir = ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"];
    	const rowSec = ["a", "s", "d", "f", "g", "h", "j", "k", "l"];
    	const rowThr = ["z", "x", "c", "v", "b", "n", "m"];
    	const dispatch = createEventDispatcher();

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

    	function btnClick(e) {
    		if (KeyCode === 13) ; else if (e.target.hasAttribute("char")) {
    			btnChar = e.target.getAttribute("char");
    			dispatch("btnCharArray", { word: btnChar });
    		}
    	}

    	const writable_props = ['keyboardArray', 'answer', 'KeyCode'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<KeyBoard> was created with unknown prop '${key}'`);
    	});

    	function div5_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			keyBind = $$value;
    			$$invalidate(0, keyBind);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('keyboardArray' in $$props) $$invalidate(5, keyboardArray = $$props.keyboardArray);
    		if ('answer' in $$props) $$invalidate(6, answer = $$props.answer);
    		if ('KeyCode' in $$props) $$invalidate(7, KeyCode = $$props.KeyCode);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		btnChar,
    		keyboardArray,
    		answer,
    		KeyCode,
    		btnIndex,
    		keyBind,
    		rowFir,
    		rowSec,
    		rowThr,
    		dispatch,
    		overlap,
    		arraySort,
    		keyStyle,
    		keyBtnForEach,
    		btnClick
    	});

    	$$self.$inject_state = $$props => {
    		if ('btnChar' in $$props) btnChar = $$props.btnChar;
    		if ('keyboardArray' in $$props) $$invalidate(5, keyboardArray = $$props.keyboardArray);
    		if ('answer' in $$props) $$invalidate(6, answer = $$props.answer);
    		if ('KeyCode' in $$props) $$invalidate(7, KeyCode = $$props.KeyCode);
    		if ('btnIndex' in $$props) btnIndex = $$props.btnIndex;
    		if ('keyBind' in $$props) $$invalidate(0, keyBind = $$props.keyBind);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*keyboardArray*/ 32) {
    			keyboardArray.length === 0
    			? undefined
    			: keyStyle(arraySort(keyboardArray[keyboardArray.length - 1]));
    		}
    	};

    	return [
    		keyBind,
    		rowFir,
    		rowSec,
    		rowThr,
    		btnClick,
    		keyboardArray,
    		answer,
    		KeyCode,
    		div5_binding
    	];
    }

    class KeyBoard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { keyboardArray: 5, answer: 6, KeyCode: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "KeyBoard",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*answer*/ ctx[6] === undefined && !('answer' in props)) {
    			console.warn("<KeyBoard> was created without expected prop 'answer'");
    		}

    		if (/*KeyCode*/ ctx[7] === undefined && !('KeyCode' in props)) {
    			console.warn("<KeyBoard> was created without expected prop 'KeyCode'");
    		}
    	}

    	get keyboardArray() {
    		throw new Error("<KeyBoard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set keyboardArray(value) {
    		throw new Error("<KeyBoard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get answer() {
    		throw new Error("<KeyBoard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set answer(value) {
    		throw new Error("<KeyBoard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get KeyCode() {
    		throw new Error("<KeyBoard>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set KeyCode(value) {
    		throw new Error("<KeyBoard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var wordsText =
      "blood,brain,bread,break,bring,brown,build,carry,catch,chair,cheap,check,child,chose,class,clean,clear,clock,close,count,cover,cream,crime,cross,crowd,dance,dream,dress,drink,drive,early,earth,empty,enjoy,enter,error,event,every,exist,false,field,fight,first,floor,focus,force,frame,fresh,front,fruit,funny,glass,grade,great,green,group,guess,guest,happy,heart,heavy,horse,house,level,light,local,lucky,lunch,magic,major,march,match,maybe,metal,money,month,mouse,mouth,movie,music,never,night,noise,ocean,often,order,other,paper,party,peace,phone,photo,place,plane,plant,power,press,reach,ready,right,river,rough,round,scene,score,sense,serve,shape,share,sharp,shelf,shirt,shock,short,since,skill,sleep,small,smart,smile,smoke,sorry,sound,space,speak,speed,spend,sport,stage,stand,start,steel,stick,still,stone,store,storm,story,study,style,sugar,super,sweet,table,taste,teach,thank,theme,there,thick,thing,think,third,throw,tight,tired,title,today,total,touch,tough,tower,train,treat,trust,twice,under,until,upset,usual,visit,voice,waste,watch,water,wheel,while,white,whole,woman,world,worry,write,wrong,young";
    // var wordsText = "paper";
    var wordsTemp = wordsText.split(/,/);
    var words = [];
    wordsTemp.forEach((word, index) => {
      words.push({ id: index, word: word });
    });
    var correctAnswer = words[Math.floor(Math.random() * words.length)];

    /* src\App.svelte generated by Svelte v3.46.4 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (92:2) {#if answerShow}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = `${correctAnswer.word}`;
    			attr_dev(div, "class", "answerShow svelte-1vo3e0d");
    			add_location(div, file, 92, 2, 2823);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(92:2) {#if answerShow}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div0;
    	let t1;
    	let div4;
    	let div3;
    	let div2;
    	let div1;
    	let answer;
    	let t2;
    	let keyboard;
    	let t3;
    	let current;
    	let mounted;
    	let dispose;

    	answer = new Answer({
    			props: {
    				answerArrayList: /*char*/ ctx[1],
    				answer: correctAnswer.word
    			},
    			$$inline: true
    		});

    	keyboard = new KeyBoard({
    			props: {
    				keyboardArray: /*keyboardLetter*/ ctx[3],
    				answer: correctAnswer.word,
    				KeyCode: /*exportKeyCode*/ ctx[2]
    			},
    			$$inline: true
    		});

    	keyboard.$on("btnCharArray", /*getBtnCharArray*/ ctx[5]);
    	let if_block = /*answerShow*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			div0.textContent = "Wordle";
    			t1 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			create_component(answer.$$.fragment);
    			t2 = space();
    			create_component(keyboard.$$.fragment);
    			t3 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "header svelte-1vo3e0d");
    			add_location(div0, file, 74, 2, 2316);
    			attr_dev(div1, "class", "answerItemWrap svelte-1vo3e0d");
    			add_location(div1, file, 78, 8, 2439);
    			attr_dev(div2, "class", "answerSheet svelte-1vo3e0d");
    			add_location(div2, file, 77, 6, 2405);
    			attr_dev(div3, "class", "mainWordle svelte-1vo3e0d");
    			add_location(div3, file, 76, 4, 2374);
    			attr_dev(div4, "class", "game svelte-1vo3e0d");
    			add_location(div4, file, 75, 2, 2351);
    			attr_dev(main, "class", "svelte-1vo3e0d");
    			add_location(main, file, 73, 0, 2307);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(main, t1);
    			append_dev(main, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			mount_component(answer, div1, null);
    			append_dev(div3, t2);
    			mount_component(keyboard, div3, null);
    			append_dev(main, t3);
    			if (if_block) if_block.m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keyDownEvent*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			const answer_changes = {};
    			if (dirty & /*char*/ 2) answer_changes.answerArrayList = /*char*/ ctx[1];
    			answer.$set(answer_changes);
    			const keyboard_changes = {};
    			if (dirty & /*keyboardLetter*/ 8) keyboard_changes.keyboardArray = /*keyboardLetter*/ ctx[3];
    			if (dirty & /*exportKeyCode*/ 4) keyboard_changes.KeyCode = /*exportKeyCode*/ ctx[2];
    			keyboard.$set(keyboard_changes);

    			if (/*answerShow*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(main, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(answer.$$.fragment, local);
    			transition_in(keyboard.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(answer.$$.fragment, local);
    			transition_out(keyboard.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(answer);
    			destroy_component(keyboard);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	console.log(correctAnswer);
    	let answerShow = false;
    	let char = [[]];
    	let exportKeyCode;
    	let dispatchWord = "";
    	let nowCharArrayIndex = 0;
    	let keyboardLetter = [];

    	function keyDownEvent(e) {
    		if (!answerShow) {
    			$$invalidate(2, exportKeyCode = e.keyCode);

    			if (e.keyCode >= 65 && e.keyCode <= 90 && char[nowCharArrayIndex].length < 5) {
    				//input a~z
    				$$invalidate(1, char[nowCharArrayIndex] = [...char[nowCharArrayIndex], e.key], char);
    			} else if (e.keyCode === 13 && char[nowCharArrayIndex].length === 5 && nowCharArrayIndex < 6) {
    				//enter
    				if (char[nowCharArrayIndex].join('') === correctAnswer.word) {
    					console.log("정답!");
    					$$invalidate(0, answerShow = true);
    				} else if (char[nowCharArrayIndex].join('') != correctAnswer.word && nowCharArrayIndex == 5) {
    					console.log("실패");
    					$$invalidate(0, answerShow = true);
    				}

    				$$invalidate(3, keyboardLetter = [...keyboardLetter, char[nowCharArrayIndex].join("")]);
    				$$invalidate(1, char[nowCharArrayIndex] = [...char[nowCharArrayIndex], e.key], char);
    				char.push([]);
    				nowCharArrayIndex += 1;
    				console.log(nowCharArrayIndex);
    			} else if (e.keyCode === 8) {
    				//backspace-delete
    				const delArray = [...char[nowCharArrayIndex]];

    				delArray.pop();
    				$$invalidate(1, char[nowCharArrayIndex] = delArray, char);
    			}

    			setTimeout(
    				() => {
    					$$invalidate(2, exportKeyCode = null);
    				},
    				0
    			);
    		}
    	}

    	function getBtnCharArray(e) {
    		if (!answerShow) {
    			dispatchWord = e.detail.word;

    			// console.dir(dispatchWord);
    			if (dispatchWord === "Del") {
    				const delArray = [...char[nowCharArrayIndex]];
    				delArray.pop();
    				$$invalidate(1, char[nowCharArrayIndex] = delArray, char);
    			} else if (dispatchWord === "Enter" && char[nowCharArrayIndex].length === 5) {
    				$$invalidate(3, keyboardLetter = [...keyboardLetter, char[nowCharArrayIndex].join("")]);
    				$$invalidate(1, char[nowCharArrayIndex] = [...char[nowCharArrayIndex], "Enter"], char);
    				char.push([]);
    				nowCharArrayIndex += 1;
    			} else if (char[nowCharArrayIndex].length < 5 && dispatchWord !== "Enter") {
    				$$invalidate(1, char[nowCharArrayIndex] = [...char[nowCharArrayIndex], dispatchWord], char);
    			}
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		each,
    		getContext,
    		setContext,
    		text,
    		Answer,
    		KeyBoard,
    		words,
    		correctAnswer,
    		answerShow,
    		char,
    		exportKeyCode,
    		dispatchWord,
    		nowCharArrayIndex,
    		keyboardLetter,
    		keyDownEvent,
    		getBtnCharArray
    	});

    	$$self.$inject_state = $$props => {
    		if ('answerShow' in $$props) $$invalidate(0, answerShow = $$props.answerShow);
    		if ('char' in $$props) $$invalidate(1, char = $$props.char);
    		if ('exportKeyCode' in $$props) $$invalidate(2, exportKeyCode = $$props.exportKeyCode);
    		if ('dispatchWord' in $$props) dispatchWord = $$props.dispatchWord;
    		if ('nowCharArrayIndex' in $$props) nowCharArrayIndex = $$props.nowCharArrayIndex;
    		if ('keyboardLetter' in $$props) $$invalidate(3, keyboardLetter = $$props.keyboardLetter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [answerShow, char, exportKeyCode, keyboardLetter, keyDownEvent, getBtnCharArray];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {
        name: "world",
      },
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
