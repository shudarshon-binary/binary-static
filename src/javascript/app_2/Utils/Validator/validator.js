import { localize }       from '_common/localize';
import { pre_build_dvrs } from './declarative_validation_rules';
import Error              from './errors';

class Validator {
    constructor(input, rules, store = null) {
        this.input  = input;
        this.rules  = rules;
        this.store  = store;
        this.errors = new Error();

        this.error_count = 0;
    }

    /**
     * Add failure and error message for given rule
     *
     * @param {string} attribute
     * @param {object} rule
     */
    addFailure(attribute, rule) {
        let message = rule.options.message || pre_build_dvrs[rule.name].message;
        if (rule.name === 'length') {
            message = localize(message, [rule.options.min === rule.options.max ? rule.options.min : `${rule.options.min}-${rule.options.max}`]);
        } else if (rule.name === 'min') {
            message = localize(message, [rule.options.min]);
        } else if (rule.name === 'not_equal') {
            message = localize(message, [localize(rule.options.name1), localize(rule.options.name2)]);
        } else {
            message = localize(message);
        }
        this.errors.add(attribute, message);
        this.error_count++;
    }

    /**
     * Runs validator
     *
     * @return {boolean} Whether it passes; true = passes, false = fails
     */
    check() {

        Object.keys(this.input).forEach(attribute => {
            if (!Object.prototype.hasOwnProperty.call(this.rules, attribute)) {
                return;
            }

            this.rules[attribute].forEach(rule => {
                const ruleObject = Validator.getRuleObject(rule);

                if (!ruleObject.validator && typeof ruleObject.validator !== 'function') {
                    return;
                }

                if (ruleObject.options.condition && !ruleObject.options.condition(this.store)) {
                    return;
                }

                if (this.input[attribute] === '' && ruleObject.name !== 'req') {
                    return;
                }

                const is_valid = ruleObject.validator(this.input[attribute], ruleObject.options, this.store);

                if (!is_valid) {
                    this.addFailure(attribute, ruleObject);
                }
            });
        });
        return !this.error_count;
    }

    /**
     * Determine if validation passes
     *
     * @return {boolean}
     */
    isPassed() {
        return this.check();
    }

    /**
     * Converts the rule array to an object
     *
     * @param {array} rule
     * @return {object}
     */
    static getRuleObject(rule) {
        const is_rule_string = typeof rule === 'string';
        const rule_object = {
            name   : is_rule_string ? rule : rule[0],
            options: is_rule_string ? {} : rule[1] || {},
        };

        rule_object.validator = rule_object.name === 'custom' ? rule[1].func : pre_build_dvrs[rule_object.name].func;

        return rule_object;
    }
}

export default Validator;
