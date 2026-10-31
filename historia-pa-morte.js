(function installStoryPaAfterKillFix() {
    'use strict';

    if (window._storyPaAfterKillFixInstalled) return;
    window._storyPaAfterKillFixInstalled = true;

    const state = {
        actionDepth: 0,
        defeatPending: false,
        defeatedBoss: null,
        defeatedPosition: null,
    };

    function isStoryBattle() {
        return !!(
            (window._storyMode || window._eventoAtivo || window._nacaoBatalha?.ativa) &&
            !window._pvpMode &&
            !window._coopMode
        );
    }

    function wrapBossDefeat() {
        const original = window.handleStoryBossDefeat;
        if (typeof original !== 'function' || original._storyPaAfterKillFix) return;

        const wrapped = function() {
            if (state.actionDepth > 0 && isStoryBattle() && boss && boss.dead) {
                state.defeatPending = true;
                state.defeatedBoss = boss;
                state.defeatedPosition = { x: boss.x, y: boss.y };
                return;
            }
            return original.apply(this, arguments);
        };
        wrapped._storyPaAfterKillFix = true;
        window.handleStoryBossDefeat = wrapped;
    }

    function wrapBravelyChain() {
        const original = window.triggerBravelyChain;
        if (typeof original !== 'function' || original._storyPaAfterKillFix) return;

        const wrapped = async function(active, target, totalAtk) {
            if (
                state.actionDepth > 0 &&
                state.defeatPending &&
                target === state.defeatedBoss &&
                target.dead &&
                state.defeatedPosition
            ) {
                const paTarget = Object.assign({}, target, state.defeatedPosition, {
                    dead: false,
                    hp: 1,
                    maxHp: 1,
                    _storyPaDefeatTarget: true,
                });
                return original.call(this, active, paTarget, totalAtk);
            }
            return original.apply(this, arguments);
        };
        wrapped._storyPaAfterKillFix = true;
        window.triggerBravelyChain = wrapped;
    }

    function wrapExecuteAction() {
        const original = window.executeAction;
        if (typeof original !== 'function' || original._storyPaAfterKillFix) return;

        const wrapped = async function() {
            if (!isStoryBattle()) return original.apply(this, arguments);

            const isOuterAction = state.actionDepth === 0;
            if (isOuterAction) {
                state.defeatPending = false;
                state.defeatedBoss = null;
                state.defeatedPosition = null;
            }
            state.actionDepth++;

            try {
                return await original.apply(this, arguments);
            } finally {
                state.actionDepth--;
                if (isOuterAction && state.defeatPending) {
                    state.defeatPending = false;
                    state.defeatedBoss = null;
                    state.defeatedPosition = null;
                    await window.handleStoryBossDefeat();
                }
            }
        };

        if (original._v69Passivas) wrapped._v69Passivas = true;
        wrapped._storyPaAfterKillFix = true;
        window.executeAction = wrapped;
    }

    wrapBossDefeat();
    wrapBravelyChain();
    wrapExecuteAction();

    console.info('[StoryPAAfterKill] PA do turno termina antes da purificação/transição.');
})();
