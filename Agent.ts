/**
 * This static class creates a dialog to retrieve one or more URLs from the user.
 * The URLs should point to a javascript module containing an exported object, 
 * which is automatically created using a namespace in TypeScript, that contains required functions.
 * If the URLs are valid, each object is saved as an instance of this class in a list of agents.
 * 
 * After after closing the dialog, call e.g. the function `foo` of agent 1 with the followin syntax 
 * ```typescript 
 * Agent.get(1).foo(...)
 * ``` 
 * @author Jirka Dell'Oro-Friedl | Hochschule Furtwangen University | 2024
 */

export default class Agent {
  [key: string]: Function

  static #urls: string[] = JSON.parse(<string>localStorage.getItem("urls")) || []
  static #agents: Agent[] = [];
  #form: HTMLFormElement = document.createElement("form")
  #url: string = ""

  /**
   * Return an agent of the list
   */
  public static get(_i: number): Agent {
    return Agent.#agents[_i];
  }

  /**
   * Import the agent functions from a URL
   * @param _url The URL to load from
   * @param _functions The functions to look for
   * @returns true if load was successful
   */
  public async import(_url: string, _functions: string[]): Promise<boolean> {
    try {
      let module = await import(_url)
      let namespace = Reflect.ownKeys(module)[0]
      for (const f of _functions)
        this[f] = Reflect.get(module, namespace)[f]
    } catch (_e) {
      console.error(_e)
      alert(_e + "\n\nSee developer console for more details")
      return false
    }

    this.#url = _url;
    return true
  }

  /**
   * Creates a dialog with a text field for the url of each agent and an import button.
   * @param _agents The number of agents required
   * @param _functions The names of the functions each agent needs to offer
   * @param _labels A list of labels, one for each field, if the label "URL" is unsufficient
   * 
   * The function returns, when valid agents were imported.
   */
  public static async createDialog(_agents: number, _functions: string[], _labels: string[] = []): Promise<void> {
    const dialog: HTMLDialogElement = document.createElement("dialog")
    dialog.innerHTML = "<h1>Import agents</h1>Select or type URL for each agent to load. Agents need to provide the following functions:"
    const list: HTMLUListElement = document.createElement("ul")
    for (let f of _functions)
      list.innerHTML += `<li>${f}</li>`
    dialog.appendChild(list)

    document.body.appendChild(dialog)
    dialog.showModal()
    for (let i: number = 0; i < _agents; i++) {
      let agent: Agent = new Agent()
      dialog.appendChild(agent.createForm(Agent.#urls[i]))
      Agent.#agents.push(agent)
    }
    const button: HTMLButtonElement = document.createElement("button")
    dialog.appendChild(button)
    button.innerText = "Import"

    let promise: Promise<void> = new Promise(_resolve =>
      button.addEventListener("click", async () => {
        let promises: Promise<boolean>[] = [];
        for (let agent of Agent.#agents) {
          const formdata: FormData = new FormData(agent.#form);
          const url: string = <string>formdata.get("url")
          promises.push(agent.import(url, _functions))
        }
        await Promise.all(promises).then((_b) => {
          if (_b.indexOf(false) == -1) {
            dialog.close()

            let topUrls: string[] = []
            for (let agent of Agent.#agents)
              topUrls.push(agent.#url)
            Agent.#urls = Agent.#urls.filter((_url: string) => topUrls.indexOf(_url) == -1)
            Agent.#urls = topUrls.concat(Agent.#urls)
            localStorage.setItem("urls", JSON.stringify(Agent.#urls))

            _resolve()
          }
        })
      }))

    await promise
  }

  private createForm(_default: string = "", _label: string = "URL"): HTMLFormElement {
    this.#form.innerHTML = `${_label} <input list="urls" name="url" size="50" /><datalist id="urls"/>`
    let input = this.#form.querySelector("input")!
    input.value = _default
    input.addEventListener("pointerdown", (_event: Event) => (<HTMLInputElement>_event.target).value = "")
    let list: HTMLDataListElement = this.#form.querySelector("datalist")!
    for (let url of Agent.#urls)
      list.innerHTML += `<option value=${url}></option>`
    return this.#form
  }
}