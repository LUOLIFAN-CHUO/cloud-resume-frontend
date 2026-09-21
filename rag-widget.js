(() => {
    const MAX_QUESTION_LENGTH = 240;
    const REQUEST_TIMEOUT_MS = 30000;

    const ERROR_MESSAGES = {
        configuration: "AI アシスタントの接続先が設定されていません。",
        invalid: "質問の内容を確認して、もう一度お試しください。",
        rateLimit: "質問が集中しています。少し時間をおいてから、もう一度お試しください。",
        unavailable: "現在、AI サービスを利用できません。しばらくしてから、もう一度お試しください。",
        timeout: "回答の生成に時間がかかっています。しばらくしてから、もう一度お試しください。",
        network: "AI サービスに接続できませんでした。通信環境を確認して、もう一度お試しください。",
        response: "回答を正しく読み込めませんでした。しばらくしてから、もう一度お試しください。",
    };

    const SECTION_LABELS = {
        about: "プロフィール",
        experience: "経験",
        projects: "プロジェクト",
        skills: "スキル",
    };

    const template = document.createElement("template");
    template.innerHTML = `
        <style>
            :host {
                --rag-accent: #4fe3c1;
                --rag-bg: #ffffff;
                --rag-ink: #263238;
                --rag-muted: #68747b;
                --rag-navy: #2e3141;
                position: fixed;
                right: 1.25rem;
                bottom: 1.25rem;
                z-index: 9000;
                color: var(--rag-ink);
                font-family: inherit;
                font-size: 16px;
                line-height: 1.5;
            }

            *, *::before, *::after { box-sizing: border-box; }
            button, textarea { font: inherit; }

            .launcher {
                display: flex;
                align-items: center;
                gap: 0.55rem;
                min-height: 3rem;
                padding: 0.7rem 1rem;
                color: #182128;
                background: var(--rag-accent);
                border: 0;
                border-radius: 999px;
                box-shadow: 0 0.8rem 2rem rgba(0, 0, 0, 0.28);
                cursor: pointer;
                font-weight: 700;
            }

            .launcher[hidden] { display: none; }
            .launcher-mark { font-size: 0.76rem; font-weight: 800; }

            .panel {
                display: none;
                width: min(24rem, calc(100vw - 2rem));
                height: min(39rem, calc(100dvh - 2rem));
                overflow: hidden;
                background: var(--rag-bg);
                border: 1px solid rgba(46, 49, 65, 0.18);
                border-radius: 0.8rem;
                box-shadow: 0 1.2rem 3.5rem rgba(0, 0, 0, 0.3);
            }

            .panel.is-open { display: flex; flex-direction: column; }

            .header {
                display: flex;
                flex: 0 0 auto;
                align-items: center;
                justify-content: space-between;
                padding: 0.85rem 1rem;
                color: #ffffff;
                background: var(--rag-navy);
            }

            .identity { display: flex; align-items: center; gap: 0.65rem; }
            .avatar {
                display: grid;
                width: 2.25rem;
                height: 2.25rem;
                place-items: center;
                color: #182128;
                background: var(--rag-accent);
                border-radius: 50%;
                font-size: 0.7rem;
                font-weight: 800;
            }

            .identity strong, .identity small { display: block; }
            .identity strong { font-size: 0.9rem; }
            .identity small { margin-top: 0.1rem; color: #c4ccd8; font-size: 0.68rem; }

            .close {
                width: 2rem;
                height: 2rem;
                padding: 0;
                color: #ffffff;
                background: transparent;
                border: 0;
                border-radius: 50%;
                cursor: pointer;
                font-size: 1.35rem;
                line-height: 1;
            }

            .close:hover, .close:focus-visible { background: rgba(255, 255, 255, 0.1); }

            .messages {
                flex: 1 1 auto;
                padding: 1rem;
                overflow-y: auto;
                background: #f7f8fa;
                overscroll-behavior: contain;
            }

            .message { display: flex; gap: 0.55rem; margin-bottom: 0.9rem; }
            .message.user { justify-content: flex-end; }
            .message-avatar {
                display: grid;
                flex: 0 0 auto;
                width: 1.7rem;
                height: 1.7rem;
                place-items: center;
                color: #182128;
                background: #d7f8f0;
                border-radius: 50%;
                font-size: 0.58rem;
                font-weight: 800;
            }

            .bubble {
                max-width: 84%;
                padding: 0.72rem 0.8rem;
                margin: 0;
                color: var(--rag-ink);
                background: #ffffff;
                border: 1px solid #e1e5e8;
                border-radius: 0.25rem 0.75rem 0.75rem 0.75rem;
                font-size: 0.78rem;
                white-space: pre-line;
            }

            .user .bubble {
                color: #ffffff;
                background: var(--rag-navy);
                border-color: var(--rag-navy);
                border-radius: 0.75rem 0.25rem 0.75rem 0.75rem;
            }

            .error .bubble { color: #7b3c38; background: #fff4f2; border-color: #f0d4cf; }
            .suggestions { display: grid; gap: 0.45rem; margin: 0 0 1rem 2.25rem; }
            .suggestions p { margin: 0 0 0.2rem; color: var(--rag-muted); font-size: 0.68rem; }
            .suggestions button {
                padding: 0.55rem 0.65rem;
                color: #38444a;
                text-align: left;
                background: #ffffff;
                border: 1px solid #dfe4e7;
                border-radius: 0.4rem;
                cursor: pointer;
                font-size: 0.7rem;
            }
            .suggestions button:hover, .suggestions button:focus-visible { border-color: #38bea3; }

            .sources { display: flex; flex-wrap: wrap; gap: 0.35rem; margin: -0.45rem 0 0.9rem 2.25rem; }
            .source {
                padding: 0.25rem 0.4rem;
                color: #346b60;
                background: #eaf9f5;
                border: 1px solid #cdece4;
                border-radius: 0.3rem;
                font-size: 0.6rem;
                font-weight: 700;
            }

            .loading { color: var(--rag-muted); }
            .notice {
                flex: 0 0 auto;
                padding: 0.5rem 0.85rem;
                color: var(--rag-muted);
                background: #f1f4f5;
                border-top: 1px solid #e0e5e7;
                font-size: 0.58rem;
            }

            form { flex: 0 0 auto; padding: 0.75rem; background: #ffffff; }
            textarea {
                display: block;
                width: 100%;
                min-height: 4.4rem;
                max-height: 7rem;
                padding: 0.65rem;
                color: var(--rag-ink);
                resize: vertical;
                background: #ffffff;
                border: 1px solid #cfd7db;
                border-radius: 0.45rem;
                outline: none;
                font-size: 0.75rem;
            }
            textarea:focus { border-color: #38bea3; box-shadow: 0 0 0 2px rgba(79, 227, 193, 0.18); }
            textarea:disabled { cursor: wait; opacity: 0.65; }

            .form-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 0.45rem; }
            .count { color: var(--rag-muted); font-size: 0.62rem; }
            .send {
                min-width: 4.5rem;
                padding: 0.45rem 0.7rem;
                color: #182128;
                background: var(--rag-accent);
                border: 0;
                border-radius: 0.35rem;
                cursor: pointer;
                font-size: 0.7rem;
                font-weight: 700;
            }
            .send:disabled { cursor: not-allowed; opacity: 0.45; }
            button:focus-visible { outline: 3px solid rgba(79, 227, 193, 0.42); outline-offset: 2px; }

            @media (max-width: 480px) {
                :host { right: 0.65rem; bottom: 0.65rem; }
                .panel { width: calc(100vw - 1.3rem); height: min(38rem, calc(100dvh - 1.3rem)); }
            }

            @media (prefers-reduced-motion: reduce) {
                *, *::before, *::after { scroll-behavior: auto !important; }
            }
        </style>

        <button class="launcher" type="button" aria-expanded="false" aria-controls="rag-panel">
            <span class="launcher-mark" aria-hidden="true">AI</span>
            <span>AI に質問</span>
        </button>

        <section id="rag-panel" class="panel" role="dialog" aria-label="履歴書 AI アシスタント" aria-hidden="true">
            <header class="header">
                <div class="identity">
                    <span class="avatar" aria-hidden="true">AI</span>
                    <span><strong>履歴書 AI</strong><small>履歴書の情報をもとに回答</small></span>
                </div>
                <button class="close" type="button" aria-label="AI アシスタントを閉じる">×</button>
            </header>

            <div class="messages" aria-live="polite">
                <div class="message assistant">
                    <span class="message-avatar" aria-hidden="true">AI</span>
                    <p class="bubble">こんにちは。スキル、プロジェクト、経験についてご質問ください。</p>
                </div>
                <div class="suggestions">
                    <p>おすすめの質問</p>
                    <button type="button" data-question="いつから勤務を開始できますか。">いつから勤務を開始できますか？</button>
                    <button type="button" data-question="AWS に関する経験を教えてください。">AWS に関する経験は？</button>
                    <button type="button" data-question="Cloud Resume Challenge について教えてください。">Cloud Resume Challenge とは？</button>
                    <button type="button" data-question="どのような技術スキルがありますか？">技術スキルについて</button>
                </div>
            </div>

            <div class="notice">質問は回答生成のために AWS へ送信されます。質問と回答は保存しません。</div>
            <form>
                <label>
                    <span style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">質問</span>
                    <textarea maxlength="240" rows="2" placeholder="知りたいことを入力してください…"></textarea>
                </label>
                <div class="form-footer">
                    <span class="count">0 / 240</span>
                    <button class="send" type="submit" disabled>送信</button>
                </div>
            </form>
        </section>
    `;

    class ResumeRagAssistant extends HTMLElement {
        connectedCallback() {
            if (this.shadowRoot) return;

            this.attachShadow({ mode: "open" });
            this.shadowRoot.append(template.content.cloneNode(true));

            this.launcher = this.shadowRoot.querySelector(".launcher");
            this.panel = this.shadowRoot.querySelector(".panel");
            this.closeButton = this.shadowRoot.querySelector(".close");
            this.messages = this.shadowRoot.querySelector(".messages");
            this.suggestions = this.shadowRoot.querySelector(".suggestions");
            this.form = this.shadowRoot.querySelector("form");
            this.input = this.shadowRoot.querySelector("textarea");
            this.count = this.shadowRoot.querySelector(".count");
            this.sendButton = this.shadowRoot.querySelector(".send");
            this.requestInProgress = false;

            this.launcher.addEventListener("click", () => this.open());
            this.closeButton.addEventListener("click", () => this.close());
            this.input.addEventListener("input", () => this.updateInputState());
            this.input.addEventListener("keydown", (event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    this.form.requestSubmit();
                }
            });
            this.form.addEventListener("submit", (event) => {
                event.preventDefault();
                this.ask(this.input.value);
            });
            this.suggestions.querySelectorAll("[data-question]").forEach((button) => {
                button.addEventListener("click", () => this.ask(button.dataset.question));
            });
            this.addEventListener("keydown", (event) => {
                if (event.key === "Escape" && this.panel.classList.contains("is-open")) this.close();
            });
        }

        open() {
            this.panel.classList.add("is-open");
            this.panel.setAttribute("aria-hidden", "false");
            this.launcher.hidden = true;
            this.launcher.setAttribute("aria-expanded", "true");
            this.input.focus();
        }

        close() {
            this.panel.classList.remove("is-open");
            this.panel.setAttribute("aria-hidden", "true");
            this.launcher.hidden = false;
            this.launcher.setAttribute("aria-expanded", "false");
            this.launcher.focus();
        }

        updateInputState() {
            const length = this.input.value.length;
            this.count.textContent = `${length} / ${MAX_QUESTION_LENGTH}`;
            this.input.disabled = this.requestInProgress;
            this.sendButton.disabled = this.requestInProgress || this.input.value.trim().length === 0;
        }

        addMessage(text, type, { error = false } = {}) {
            const message = document.createElement("div");
            message.className = `message ${type}${error ? " error" : ""}`;
            if (error) message.setAttribute("role", "alert");

            if (type === "assistant") {
                const avatar = document.createElement("span");
                avatar.className = "message-avatar";
                avatar.setAttribute("aria-hidden", "true");
                avatar.textContent = "AI";
                message.append(avatar);
            }

            const bubble = document.createElement("p");
            bubble.className = "bubble";
            bubble.textContent = text;
            message.append(bubble);
            this.messages.append(message);
            return message;
        }

        addSources(sources) {
            if (sources.length === 0) return;
            const wrapper = document.createElement("div");
            wrapper.className = "sources";
            wrapper.setAttribute("aria-label", "回答の参照元");

            sources.forEach((source) => {
                const title = source.title.trim();
                const sectionLabel = SECTION_LABELS[source.section.trim()];
                const label = !sectionLabel || title.startsWith(sectionLabel)
                    ? title
                    : `${sectionLabel} · ${title}`;
                const chip = document.createElement("span");
                chip.className = "source";
                chip.textContent = label;
                wrapper.append(chip);
            });
            this.messages.append(wrapper);
        }

        scrollToLatest() {
            this.messages.scrollTo({ top: this.messages.scrollHeight, behavior: "smooth" });
        }

        async ask(rawQuestion) {
            const question = rawQuestion.trim();
            if (!question || this.requestInProgress) return;

            this.requestInProgress = true;
            this.input.value = "";
            this.updateInputState();
            this.suggestions.remove();
            this.addMessage(question, "user");
            const loading = this.addMessage("回答を作成しています…", "assistant");
            loading.classList.add("loading");
            this.scrollToLatest();

            try {
                const result = await this.requestAnswer(question);
                loading.remove();
                this.addMessage(result.answer, "assistant");
                this.addSources(result.sources);
            } catch (error) {
                loading.remove();
                this.addMessage(error.message || ERROR_MESSAGES.unavailable, "assistant", { error: true });
                this.input.value = question;
            } finally {
                this.requestInProgress = false;
                this.updateInputState();
                this.scrollToLatest();
                this.input.focus();
            }
        }

        async requestAnswer(question) {
            const apiUrl = this.getAttribute("api-url")?.trim();
            if (!apiUrl) throw new Error(ERROR_MESSAGES.configuration);

            const controller = new AbortController();
            const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

            try {
                const response = await fetch(apiUrl, {
                    method: "POST",
                    mode: "cors",
                    credentials: "omit",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question }),
                    signal: controller.signal,
                });

                let payload = {};
                try {
                    payload = await response.json();
                } catch {
                    if (response.status === 429) throw new Error(ERROR_MESSAGES.rateLimit);
                    if (!response.ok) throw new Error(ERROR_MESSAGES.unavailable);
                    throw new Error(ERROR_MESSAGES.response);
                }

                if (!response.ok) {
                    if (response.status === 400) {
                        throw new Error(payload?.error?.message || ERROR_MESSAGES.invalid);
                    }
                    if (response.status === 429) throw new Error(ERROR_MESSAGES.rateLimit);
                    throw new Error(ERROR_MESSAGES.unavailable);
                }

                const validSources = Array.isArray(payload.sources) && payload.sources.every((source) =>
                    source && typeof source.title === "string" && source.title.trim() &&
                    typeof source.section === "string" && source.section.trim()
                );
                if (typeof payload.answer !== "string" || !payload.answer.trim() || !validSources) {
                    throw new Error(ERROR_MESSAGES.response);
                }

                return {
                    answer: payload.answer,
                    sources: payload.sources,
                };
            } catch (error) {
                if (error.name === "AbortError") throw new Error(ERROR_MESSAGES.timeout);
                if (error instanceof TypeError) throw new Error(ERROR_MESSAGES.network);
                throw error;
            } finally {
                window.clearTimeout(timeoutId);
            }
        }
    }

    customElements.define("resume-rag-assistant", ResumeRagAssistant);
})();
