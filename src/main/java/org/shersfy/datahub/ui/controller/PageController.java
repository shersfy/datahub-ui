package org.shersfy.datahub.ui.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.servlet.ModelAndView;

@Controller
public class PageController extends BaseController{
    
    @RequestMapping("/index.html")
    public ModelAndView index2() {
        ModelAndView mv = new ModelAndView("index");
        mv.addObject("sessionId", getRequest().getSession().getId());
        return mv;
    }
    
    @RequestMapping("/")
    public ModelAndView index() {
        return new ModelAndView("redirect:/index.html");
    }
    
    @RequestMapping("/index")
    public ModelAndView index1() {
        return new ModelAndView("redirect:/index.html");
    }
    
    @RequestMapping("/login")
    public ModelAndView login() {
        ModelAndView mv = new ModelAndView("login");
        return mv;
    }

}
