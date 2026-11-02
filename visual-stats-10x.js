(function installVisualStats10x() {
    'use strict';

    const FACTOR = 10;
    const QUERY_PARAM = 'visualStats10x';
    const changedTextNodes = new Map();
    let observer = null;
    let enabled = false;

    function scaleNumber(value) {
        const sign = value[0] === '+' || value[0] === '-' ? value[0] : '';
        const numericValue = Number(value.replace(/^[+-]/, '').replace(',', '.'));
        if (!Number.isFinite(numericValue)) return value;
        const scaledValue = numericValue * FACTOR;
        return (sign === '+' ? '+' : sign === '-' ? '-' : '') + String(scaledValue);
    }

    function scaleAllNumbers(text) {
        return text.replace(/(^|[^\w])([+-]?\d+(?:[.,]\d+)?)/g, (match, prefix, value) =>
            prefix + scaleNumber(value)
        );
    }

    function scaleLabeledNumbers(text) {
        const pattern = /(\b(?:HP|ATK)(?:\s+(?:em\s+formas|no\s+poder\s+ancestral))?\s*(?:[:=]\s*)?)([+-]?\d+(?:[.,]\d+)?)(?:\s*(\/)\s*([+-]?\d+(?:[.,]\d+)?))?|([+-]?\d+(?:[.,]\d+)?)(\s*)(\b(?:HP|ATK)\b)|(\b(?:dano|cura)\b(?:\s+(?:de|em|por))?\s*[:=]?\s*)([+-]?\d+(?:[.,]\d+)?)|([+-]?\d+(?:[.,]\d+)?)(\s*(?:de\s+)?)(\b(?:dano|cura)\b)/gi;

        return text.replace(pattern, (match, prefixStat, statValue, ratioSeparator, ratioValue, numberBeforeStat, statSpace, statLabel, prefixEffect, effectValue, numberBeforeEffect, effectSpace, effectLabel) => {
            if (prefixStat) {
                return prefixStat + scaleNumber(statValue)
                    + (ratioValue ? `${ratioSeparator}${scaleNumber(ratioValue)}` : '');
            }
            if (numberBeforeStat) return scaleNumber(numberBeforeStat) + statSpace + statLabel;
            if (prefixEffect) return prefixEffect + scaleNumber(effectValue);
            return scaleNumber(numberBeforeEffect) + effectSpace + effectLabel;
        });
    }

    function findScaleMode(textNode) {
        const element = textNode.parentElement;
        if (!element) return null;

        if (element.closest(
            '.dmg-float, .heal-float, .hero-status-atk, .story-hero-level, .bestiary-card-stats, #bossStatsDisplay, #bossCardHp'
        )) {
            return 'all';
        }

        if (/^player\d+HP$/i.test(element.id)) return 'all';

        if (element.matches('.hero-status-hp > span:first-child')) return 'all';

        const detailValue = element.closest('.hero-details-stat-value');
        if (detailValue) {
            const stat = detailValue.parentElement?.querySelector('.hero-details-stat-label')?.textContent.trim();
            if (stat === 'HP' || stat === 'ATK') return 'all';
        }

        const bestiaryStats = element.closest('.bestiary-card-stats');
        if (bestiaryStats) {
            const statValue = textNode.parentElement.closest('span');
            const stat = statValue?.querySelector('b')?.textContent.trim();
            if (stat === 'HP' || stat === 'ATK') return 'all';
        }

        return 'labeled';
    }

    function isExcluded(textNode) {
        return !!textNode.parentElement?.closest(
            'script, style, noscript, textarea, input, select, option, [contenteditable="true"]'
        );
    }

    function processTextNode(textNode) {
        if (!enabled || !textNode.parentElement || isExcluded(textNode)) return;

        const previous = changedTextNodes.get(textNode);
        if (previous && textNode.data === previous.rendered) return;

        const original = textNode.data;
        const mode = findScaleMode(textNode);
        const rendered = mode === 'all'
            ? scaleAllNumbers(original)
            : scaleLabeledNumbers(original);

        if (rendered === original) {
            changedTextNodes.delete(textNode);
            return;
        }

        changedTextNodes.set(textNode, { original, rendered });
        textNode.data = rendered;
    }

    function processSubtree(root) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            processTextNode(root);
            return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = walker.nextNode())) {
            processTextNode(textNode);
        }
    }

    function forgetSubtree(root) {
        if (!root) return;
        if (root.nodeType === Node.TEXT_NODE) {
            changedTextNodes.delete(root);
            return;
        }

        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        let textNode;
        while ((textNode = walker.nextNode())) {
            changedTextNodes.delete(textNode);
        }
    }

    function enable() {
        if (enabled) return;
        enabled = true;
        processSubtree(document.body);

        observer = new MutationObserver(records => {
            records.forEach(record => {
                if (record.type === 'characterData') {
                    processTextNode(record.target);
                    return;
                }
                if (record.type === 'attributes') {
                    processSubtree(record.target);
                    return;
                }
                record.addedNodes.forEach(processSubtree);
                record.removedNodes.forEach(forgetSubtree);
            });
        });
        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['class', 'id'],
            childList: true,
            characterData: true,
            subtree: true
        });
        console.info('[VisualStats10x] Ativado: números de HP, ATK, dano e cura ×10 apenas na interface.');
    }

    function disable() {
        if (observer) observer.disconnect();
        observer = null;
        enabled = false;

        changedTextNodes.forEach((value, textNode) => {
            if (textNode.data === value.rendered) textNode.data = value.original;
        });
        changedTextNodes.clear();
        console.info('[VisualStats10x] Desativado; os números da interface voltaram ao normal.');
    }

    window.formatVisualStats10x = scaleLabeledNumbers;
    window.enableVisualStats10x = enable;
    window.disableVisualStats10x = disable;

    if (new URLSearchParams(window.location.search).get(QUERY_PARAM) === '0') {
        console.info('[VisualStats10x] Desativado pelo parâmetro ?visualStats10x=0.');
    } else {
        enable();
    }
})();
